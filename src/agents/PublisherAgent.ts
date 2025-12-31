import type { Tables } from "@/db/types";
import * as experimentsRepo from "@/repos/experiments";
import * as videoAssetsRepo from "@/repos/videoAssets";
import {
  PublishRequestSchema,
  type PublishPlatform,
  type PublishRequest,
  type PublishResult,
} from "@/schemas/publisherSchemas";
import BaseAgent from "./BaseAgent";

export interface PublisherAgentResult {
  asset: Tables<"video_assets">;
  experiments: Tables<"experiments">[];
  results: PublishResult[];
  experimentId?: string | null;
}

export class PublisherAgentError extends Error {
  code: "VALIDATION" | "NOT_FOUND" | "PERSISTENCE" | "UNKNOWN";

  constructor(
    message: string,
    code: PublisherAgentError["code"] = "UNKNOWN",
  ) {
    super(message);
    this.name = "PublisherAgentError";
    this.code = code;
  }
}

export class PublisherAgent extends BaseAgent {
  constructor({ agentName = "PublisherAgent" } = {}) {
    super(agentName);
  }

  async run(rawInput: unknown): Promise<PublisherAgentResult> {
    await this.logEvent("agent.start", { input: rawInput });
    await this.logEvent("publish.start", { input: rawInput });

    try {
      const input = PublishRequestSchema.parse(rawInput);
      const { asset, scriptId, productId, experimentId } = await this.resolveAssetContext(input);

      const resolvedPlatforms = this.resolvePlatforms(input.platforms);
      const results = this.simulatePublishing({
        assetId: asset.asset_id,
        platforms: resolvedPlatforms,
        videoUrl: input.videoUrl ?? asset.storage_path ?? undefined,
      });
      const experiments = await this.persistExperiments({
        assetId: asset.asset_id,
        scriptId,
        productId,
        experimentId,
        results,
      });

      const response: PublisherAgentResult = {
        asset,
        experiments,
        results,
        experimentId,
      };

      await this.logEvent("publish.success", {
        assetId: asset.asset_id,
        scriptId,
        productId,
        experimentId,
        platforms: resolvedPlatforms.map((platform) => platform.platform),
        results,
      });
      await this.logEvent("agent.success", {
        assetId: asset.asset_id,
        scriptId,
        productId,
        experimentId,
      });

      return response;
    } catch (error) {
      const normalizedError =
        error instanceof PublisherAgentError ? error : new PublisherAgentError(
          error instanceof Error ? error.message : String(error),
        );

      await this.logEvent("publish.error", {
        message: normalizedError.message,
        code: normalizedError.code,
      });
      await this.logEvent("agent.error", {
        message: normalizedError.message,
        code: normalizedError.code,
      });

      return this.handleError("PublisherAgent.run", normalizedError);
    }
  }

  private async resolveAssetContext(
    input: PublishRequest,
  ): Promise<{
    asset: Tables<"video_assets">;
    scriptId: string | null;
    productId: string | null;
    experimentId: string | null;
  }> {
    let assetId = input.assetId;
    let scriptId = input.scriptId ?? null;
    let productId = input.productId ?? null;
    const experimentId = input.experimentId ?? null;

    if (!assetId && experimentId) {
      const experiment = await experimentsRepo.getExperimentById(experimentId);
      if (!experiment) {
        throw new PublisherAgentError(
          `Experiment ${experimentId} not found`,
          "NOT_FOUND",
        );
      }
      assetId = experiment.asset_id ?? undefined;
      scriptId = scriptId ?? experiment.script_id ?? null;
      productId = productId ?? experiment.product_id ?? null;
    }

    if (!assetId) {
      throw new PublisherAgentError(
        "assetId is required when experiment does not provide one",
        "VALIDATION",
      );
    }

    const asset = await this.getAsset(assetId);
    const resolvedScriptId = scriptId ?? asset.script_id ?? null;

    return {
      asset,
      scriptId: resolvedScriptId,
      productId,
      experimentId,
    };
  }

  private resolvePlatforms(platforms: PublishPlatform[]): PublishPlatform[] {
    if (platforms.length > 0) {
      return platforms;
    }

    return [{ platform: "youtube", tags: [] }];
  }

  private async getAsset(assetId: string): Promise<Tables<"video_assets">> {
    const asset = await videoAssetsRepo.getVideoAssetById(assetId);

    if (!asset) {
      throw new PublisherAgentError(
        `Video asset ${assetId} not found`,
        "NOT_FOUND",
      );
    }

    return asset;
  }

  private simulatePublishing({
    assetId,
    platforms,
    videoUrl,
  }: {
    assetId: string;
    platforms: PublishPlatform[];
    videoUrl?: string;
  }): PublishResult[] {
    const publishedAt = this.now();
    return platforms.map((platform, index) => {
      const slug = `${platform.platform}-${assetId.slice(0, 8)}-${index + 1}`;
      return {
        platform: platform.platform,
        status: "published" as const,
        url: videoUrl ?? `https://${platform.platform}.example.com/watch/${slug}`,
        externalId: `mock-${slug}`,
        publishedAt,
        notes: platform.description ?? platform.title ?? "Mock publish completed",
      };
    });
  }

  private async persistExperiments({
    assetId,
    scriptId,
    productId,
    experimentId,
    results,
  }: {
    assetId: string;
    scriptId: string | null;
    productId: string | null;
    experimentId: string | null;
    results: PublishResult[];
  }): Promise<Tables<"experiments">[]> {
    const createdAt = this.now();
    const createdExperiments: Tables<"experiments">[] = [];

    if (experimentId) {
      try {
        const updated = await experimentsRepo.updateExperiment(experimentId, {
          asset_id: assetId,
          script_id: scriptId,
          product_id: productId,
          hypothesis: `Mock publish to ${results[0]?.platform ?? "unknown"}`,
          variation_label: results[0]?.platform ?? null,
        });

        if (updated) {
          createdExperiments.push(updated);
        }
      } catch (error) {
        throw new PublisherAgentError(
          `Failed to update experiment ${experimentId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "PERSISTENCE",
        );
      }
    }

    for (const result of results) {
      try {
        if (experimentId && createdExperiments.length > 0) {
          continue;
        }
        const experiment = await experimentsRepo.createExperiment({
          asset_id: assetId,
          script_id: scriptId,
          product_id: productId,
          hypothesis: `Mock publish to ${result.platform}`,
          variation_label: result.platform,
          created_at: createdAt,
        });
        createdExperiments.push(experiment);
      } catch (error) {
        throw new PublisherAgentError(
          `Failed to persist experiment for ${result.platform}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "PERSISTENCE",
        );
      }
    }

    return createdExperiments;
  }
}

export default PublisherAgent;