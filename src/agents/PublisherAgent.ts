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
      const asset = await this.getAsset(input.assetId);
      const scriptId = input.scriptId ?? asset.script_id ?? null;
      const productId = input.productId ?? null;

      const results = this.simulatePublishing(asset.asset_id, input.platforms);
      const experiments = await this.persistExperiments({
        assetId: asset.asset_id,
        scriptId,
        productId,
        results,
      });

      const response: PublisherAgentResult = {
        asset,
        experiments,
        results,
      };

      await this.logEvent("publish.success", {
        assetId: asset.asset_id,
        scriptId,
        productId,
        platforms: input.platforms.map((platform) => platform.platform),
        results,
      });
      await this.logEvent("agent.success", {
        assetId: asset.asset_id,
        scriptId,
        productId,
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

  private simulatePublishing(
    assetId: string,
    platforms: PublishPlatform[],
  ): PublishResult[] {
    const publishedAt = this.now();
    return platforms.map((platform, index) => {
      const slug = `${platform.platform}-${assetId.slice(0, 8)}-${index + 1}`;
      return {
        platform: platform.platform,
        status: "published" as const,
        url: `https://${platform.platform}.example.com/watch/${slug}`,
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
    results,
  }: {
    assetId: string;
    scriptId: string | null;
    productId: string | null;
    results: PublishResult[];
  }): Promise<Tables<"experiments">[]> {
    const createdAt = this.now();
    const createdExperiments: Tables<"experiments">[] = [];

    for (const result of results) {
      try {
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
