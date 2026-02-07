import { z } from "zod";
import type BaseAgent from "../../agents/BaseAgent";
import {
  EditorAgent,
  type EditorAgentResult,
} from "../../agents/EditorAgent";
import {
  PublisherAgent,
  type PublisherAgentResult,
} from "../../agents/PublisherAgent";
import {
  ScriptwriterAgent,
  type ScriptwriterResult,
} from "../../agents/ScriptwriterAgent";
import * as creativePatternsRepo from "../../repos/creativePatterns";
import * as experimentsRepo from "../../repos/experiments";
import * as productsRepo from "../../repos/products";
import * as publishedPostsRepo from "../../repos/publishedPosts";
import * as trendSnapshotsRepo from "../../repos/trendSnapshots";
import { fetchRecentSystemEvents, logSystemEvent } from "../../repos/systemEvents";
import {
  EditorAgentInputSchema,
  PublishRequestSchema,
  ScriptwriterAgentInputSchema,
  type PublishRequest,
} from "../../schemas/agentSchemas";
import {
  AgentNameSchema,
  AgentRunRequestSchema,
  EditorRenderRequestSchema,
  PublisherPublishRequestSchema,
  ScriptwriterGenerateRequestSchema,
  type AgentName,
  type EditorRenderRequest,
  type PublisherPublishRequest,
  type ScriptwriterGenerateRequest,
} from "../../schemas/apiSchemas";

type AgentStatus = "idle" | "running" | "error";

export interface AgentStatusRow {
  name: string;
  status: AgentStatus;
  lastRun: string | null;
  lastEvent: string | null;
}

interface AgentDescriptor {
  create: () => BaseAgent;
  inputSchema: z.ZodTypeAny;
}

export type TriggerAgentRunSuccess = {
  message: string;
  result: unknown;
};

export class AgentApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AgentApiError";
    this.status = status;
    this.details = details;
  }
}

const agentRegistry: Record<AgentName, AgentDescriptor> = {
  ScriptwriterAgent: {
    create: () => new ScriptwriterAgent(),
    inputSchema: ScriptwriterAgentInputSchema,
  },
  EditorAgent: {
    create: () => new EditorAgent(),
    inputSchema: EditorAgentInputSchema,
  },
  PublisherAgent: {
    create: () => new PublisherAgent(),
    inputSchema: PublishRequestSchema,
  },
};

const deriveStatus = (eventType?: string | null): AgentStatus => {
  if (!eventType) {
    return "idle";
  }

  if (eventType.includes("error")) {
    return "error";
  }

  if (eventType.endsWith(".start") || eventType === "start") {
    return "running";
  }

  return "idle";
};

const isNewer = (candidate?: string | null, current?: string | null) => {
  if (!candidate) {
    return false;
  }
  if (!current) {
    return true;
  }
  return new Date(candidate).getTime() > new Date(current).getTime();
};

const nowIso = () => new Date().toISOString();

type WorkflowContext = Pick<
  ScriptwriterGenerateRequest | EditorRenderRequest | PublisherPublishRequest,
  "workflow_id" | "correlation_id"
>;

const attachContext = (
  payload: Record<string, unknown>,
  context: WorkflowContext,
) => ({
  ...payload,
  workflow_id: context.workflow_id ?? null,
  correlation_id: context.correlation_id ?? null,
});

const logLifecycleEvent = async (
  agentName: AgentName,
  eventType: string,
  payload: Record<string, unknown>,
  context: WorkflowContext,
) =>
  logSystemEvent({
    agent_name: agentName,
    event_type: eventType,
    workflow_id: context.workflow_id ?? null,
    correlation_id: context.correlation_id ?? null,
    payload: attachContext(payload, context),
    created_at: nowIso(),
  });

export const listAgentStatuses = async (): Promise<AgentStatusRow[]> => {
  const events = await fetchRecentSystemEvents(200);
  const baseMap = new Map<string, AgentStatusRow>();

  Object.keys(agentRegistry).forEach((name) => {
    baseMap.set(name, {
      name,
      status: "idle",
      lastRun: null,
      lastEvent: null,
    });
  });

  events.forEach((event) => {
    const agentName = event.agent_name ?? null;
    if (!agentName) {
      return;
    }

    const current = baseMap.get(agentName) ?? {
      name: agentName,
      status: "idle" as AgentStatus,
      lastRun: null,
      lastEvent: null,
    };

    if (isNewer(event.created_at, current.lastRun)) {
      baseMap.set(agentName, {
        name: agentName,
        status: deriveStatus(event.event_type),
        lastRun: event.created_at ?? current.lastRun,
        lastEvent: event.event_type ?? current.lastEvent,
      });
    }
  });

  return Array.from(baseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const getProductOrThrow = async (
  productId: string,
  context: WorkflowContext,
) => {
  const product = await productsRepo.getProductById(productId);

  if (!product) {
    throw new AgentApiError(
      `Product ${productId} not found`,
      400,
      attachContext({ product_id: productId }, context),
    );
  }

  return product;
};

const getCreativePatternOrThrow = async (
  creativePatternId: string,
  context: WorkflowContext,
) => {
  const pattern = await creativePatternsRepo.getCreativePatternById(creativePatternId);

  if (!pattern) {
    throw new AgentApiError(
      `Creative pattern ${creativePatternId} not found`,
      400,
      attachContext({ creative_pattern_id: creativePatternId }, context),
    );
  }

  return pattern;
};

const getTrendSnapshotOrThrow = async (
  trendSnapshotId: string,
  context: WorkflowContext,
) => {
  const trendSnapshot = await trendSnapshotsRepo.getTrendSnapshotById(trendSnapshotId);

  if (!trendSnapshot) {
    throw new AgentApiError(
      `Trend snapshot ${trendSnapshotId} not found`,
      400,
      attachContext({ trend_snapshot_id: trendSnapshotId }, context),
    );
  }

  return trendSnapshot;
};

const getExperimentOrThrow = async (
  experimentId: string,
  context: WorkflowContext,
) => {
  const experiment = await experimentsRepo.getExperimentById(experimentId);

  if (!experiment) {
    throw new AgentApiError(
      `Experiment ${experimentId} not found`,
      400,
      attachContext({ experiment_id: experimentId }, context),
    );
  }

  return experiment;
};

export const generateScriptFromApi = async (rawBody: unknown) => {
  const parsedBody = ScriptwriterGenerateRequestSchema.parse(rawBody ?? {});
  const context: WorkflowContext = {
    workflow_id: parsedBody.workflow_id,
    correlation_id: parsedBody.correlation_id,
  };

  await Promise.all([
    getProductOrThrow(parsedBody.product_id, context),
    getCreativePatternOrThrow(parsedBody.creative_pattern_id, context),
    getTrendSnapshotOrThrow(parsedBody.trend_snapshot_id, context),
  ]);

  await logLifecycleEvent(
    "ScriptwriterAgent",
    "agent.run.start",
    {
      product_id: parsedBody.product_id,
      creative_pattern_id: parsedBody.creative_pattern_id,
      trend_snapshot_id: parsedBody.trend_snapshot_id,
    },
    context,
  );

  await logLifecycleEvent(
    "ScriptwriterAgent",
    "script.generate.start",
    {
      product_id: parsedBody.product_id,
      creative_pattern_id: parsedBody.creative_pattern_id,
      trend_snapshot_id: parsedBody.trend_snapshot_id,
    },
    context,
  );

  try {
    const agentInput = ScriptwriterAgentInputSchema.parse({
      productId: parsedBody.product_id,
      creativePatternId: parsedBody.creative_pattern_id,
      trendSnapshotId: parsedBody.trend_snapshot_id,
    });

    const result = (await new ScriptwriterAgent().execute(agentInput)) as ScriptwriterResult;
    const script = result.script;

    if (!script) {
      throw new AgentApiError(
        "ScriptwriterAgent returned no script record",
        500,
        attachContext({ product_id: parsedBody.product_id }, context),
      );
    }

    await logLifecycleEvent(
      "ScriptwriterAgent",
      "script.generate.success",
      { product_id: script.product_id, script_id: script.script_id },
      context,
    );
    await logLifecycleEvent(
      "ScriptwriterAgent",
      "agent.run.success",
      { product_id: script.product_id, script_id: script.script_id },
      context,
    );

    return {
      workflow_id: parsedBody.workflow_id ?? null,
      correlation_id: parsedBody.correlation_id ?? null,
      script_id: script.script_id,
      product_id: script.product_id,
      title: script.title ?? "",
      script_text: script.script_text ?? "",
      hook: script.hook ?? "",
      creative_variables: script.creative_variables ?? null,
      created_at: script.created_at ?? nowIso(),
    };
  } catch (error) {
    await logLifecycleEvent(
      "ScriptwriterAgent",
      "script.generate.error",
      {
        product_id: parsedBody.product_id,
        creative_pattern_id: parsedBody.creative_pattern_id,
        trend_snapshot_id: parsedBody.trend_snapshot_id,
        message: error instanceof Error ? error.message : String(error),
      },
      context,
    );
    await logLifecycleEvent(
      "ScriptwriterAgent",
      "agent.run.error",
      {
        product_id: parsedBody.product_id,
        creative_pattern_id: parsedBody.creative_pattern_id,
        trend_snapshot_id: parsedBody.trend_snapshot_id,
        message: error instanceof Error ? error.message : String(error),
      },
      context,
    );

    if (error instanceof AgentApiError) {
      throw error;
    }

    const causeMessage = error instanceof Error ? error.message : String(error);
    throw new AgentApiError(
      "Failed to generate script",
      500,
      attachContext(
        {
          product_id: parsedBody.product_id,
          creative_pattern_id: parsedBody.creative_pattern_id,
          trend_snapshot_id: parsedBody.trend_snapshot_id,
          cause_message: causeMessage,
        },
        context,
      ),
    );
  }
};

export const renderAssetFromApi = async (rawBody: unknown) => {
  let context: WorkflowContext | null = null;
  let scriptId: string | null = null;

  try {
    const parsedBody = EditorRenderRequestSchema.parse(rawBody ?? {});
    context = {
      workflow_id: parsedBody.workflow_id,
      correlation_id: parsedBody.correlation_id,
    };
    scriptId = parsedBody.script_id;

    // Note: Validation of script/template existence is handled by EditorAgent v2.
    // The handler delegates all business logic to the agent.

    // Pass the full input including workflow context to the agent
    // EditorAgent v2 uses EditorRequestSchema internally to parse specific fields
    const agentInput: Record<string, unknown> = {
      scriptId: parsedBody.script_id,
      composition: parsedBody.composition,
    };

    if (parsedBody.style_template_id) {
      agentInput.styleTemplateId = parsedBody.style_template_id;
    }

    if (parsedBody.render_backend) {
      agentInput.renderBackend = parsedBody.render_backend;
    }

    await logLifecycleEvent(
      "EditorAgent",
      "agent.run.start",
      { script_id: parsedBody.script_id },
      context,
    );

    // Execute agent - this will emit agent.start, video.render.* events
    const result = (await new EditorAgent().execute(
      agentInput,
    )) as EditorAgentResult;

    const { persistedAsset, storageUrl, asset } = result;

    const response = {
      asset_id: persistedAsset.asset_id,
      script_id: persistedAsset.script_id,
      storage_url: storageUrl,
      duration: persistedAsset.duration_seconds,
      tone: asset.tone,
      layout: asset.layout,
      style_tags: asset.styleTags,
      metadata: result.metadata ?? {},
      created_at: persistedAsset.created_at ?? nowIso(),
      workflow_id: parsedBody.workflow_id ?? null,
      correlation_id: parsedBody.correlation_id ?? null,
    };

    await logLifecycleEvent(
      "EditorAgent",
      "agent.run.success",
      { script_id: response.script_id, asset_id: response.asset_id },
      context,
    );

    return response;
  } catch (error) {
    if (context) {
      await logLifecycleEvent(
        "EditorAgent",
        "agent.run.error",
        {
          script_id: scriptId,
          message: error instanceof Error ? error.message : String(error),
        },
        context,
      );
    }

    if (error instanceof z.ZodError) {
      throw new AgentApiError("Invalid request data", 400, error.errors);
    }

    if (error instanceof AgentApiError) {
      throw error;
    }

    // Map EditorAgent errors to API errors
    /* 
       We need to check if the error is an EditorAgentError.
       Since we can't easily instanceof check a class from another module if strictly importing types unless we import the class value,
       we should ensure EditorAgent is imported as a value. 
       (It is imported as { EditorAgent, ... } already).
    */
    if (
      // Check if it looks like an EditorAgentError (has code property) or instanceof
      // Using duck typing or explicit check if available
      (error as any).name === "EditorAgentError" ||
      (error as any).code
    ) {
      const code = (error as any).code; // EditorAgentErrorCode
      const message = (error as Error).message;

      switch (code) {
        case "VALIDATION":
        case "NOT_FOUND":
          throw new AgentApiError(message, 400, { code });
        default:
          throw new AgentApiError(message, 500, { code });
      }
    }

    throw new AgentApiError(
      error instanceof Error ? error.message : "Internal Server Error",
      500,
    );
  }
};

export const publishExperimentPostFromApi = async (rawBody: unknown) => {
  const parsedBody = PublisherPublishRequestSchema.parse(rawBody ?? {});
  const context: WorkflowContext = {
    workflow_id: parsedBody.workflow_id,
    correlation_id: parsedBody.correlation_id,
  };

  const experiment = await getExperimentOrThrow(parsedBody.experiment_id, context);

  await logLifecycleEvent(
    "PublisherAgent",
    "agent.run.start",
    { experiment_id: parsedBody.experiment_id, platform: parsedBody.platform },
    context,
  );

  await logLifecycleEvent(
    "PublisherAgent",
    "publish.start",
    { experiment_id: parsedBody.experiment_id, platform: parsedBody.platform },
    context,
  );

  try {
    const agentInput: PublishRequest = {
      experimentId: parsedBody.experiment_id,
      assetId: experiment.asset_id ?? undefined,
      scriptId: experiment.script_id ?? undefined,
      productId: experiment.product_id ?? undefined,
      platforms: [{ platform: parsedBody.platform, tags: [] }],
    };

    const result = (await new PublisherAgent().execute(agentInput)) as PublisherAgentResult;
    const publishResult = result.results[0];

    if (!publishResult) {
      throw new AgentApiError(
        "PublisherAgent returned no publish results",
        500,
        attachContext({ experiment_id: parsedBody.experiment_id }, context),
      );
    }

    const post = await publishedPostsRepo.createPublishedPost({
      experiment_id: parsedBody.experiment_id,
      platform: publishResult.platform,
      platform_post_id: publishResult.externalId,
      posted_at: publishResult.publishedAt,
      caption: null,
      hashtags: null,
      created_at: nowIso(),
    });

    await logLifecycleEvent(
      "PublisherAgent",
      "publish.success",
      {
        experiment_id: parsedBody.experiment_id,
        platform: parsedBody.platform,
        post_id: post.post_id,
      },
      context,
    );
    await logLifecycleEvent(
      "PublisherAgent",
      "agent.run.success",
      {
        experiment_id: parsedBody.experiment_id,
        platform: parsedBody.platform,
        post_id: post.post_id,
      },
      context,
    );

    return {
      workflow_id: parsedBody.workflow_id ?? null,
      correlation_id: parsedBody.correlation_id ?? null,
      post_id: post.post_id,
      experiment_id: parsedBody.experiment_id,
      platform: post.platform,
      external_post_id: post.platform_post_id ?? publishResult.externalId,
      published_at: post.posted_at ?? publishResult.publishedAt,
    };
  } catch (error) {
    await logLifecycleEvent(
      "PublisherAgent",
      "publish.error",
      {
        experiment_id: parsedBody.experiment_id,
        platform: parsedBody.platform,
        message: error instanceof Error ? error.message : String(error),
      },
      context,
    );
    await logLifecycleEvent(
      "PublisherAgent",
      "agent.run.error",
      {
        experiment_id: parsedBody.experiment_id,
        platform: parsedBody.platform,
        message: error instanceof Error ? error.message : String(error),
      },
      context,
    );

    if (error instanceof AgentApiError) {
      throw error;
    }

    throw new AgentApiError(
      "Failed to publish experiment post",
      500,
      attachContext(
        {
          experiment_id: parsedBody.experiment_id,
          platform: parsedBody.platform,
        },
        context,
      ),
    );
  }
};

export const triggerAgentRun = async (
  agentName: string,
  rawBody: unknown,
): Promise<TriggerAgentRunSuccess> => {
  const validatedName = AgentNameSchema.parse(agentName);
  const agentDescriptor = agentRegistry[validatedName];

  if (!agentDescriptor) {
    throw new Error(`Agent ${validatedName} is not registered`);
  }

  const parsedBody = AgentRunRequestSchema.parse(rawBody ?? {});
  const validatedInput = agentDescriptor.inputSchema.parse(parsedBody.input ?? {});
  const startedAt = nowIso();

  await logSystemEvent({
    agent_name: validatedName,
    event_type: "agent.start",
    payload: { trigger: "manual_api", input: validatedInput },
    created_at: startedAt,
  });

  try {
    const result = await agentDescriptor.create().execute(validatedInput);

    await logSystemEvent({
      agent_name: validatedName,
      event_type: "agent.success",
      payload: { trigger: "manual_api", input: validatedInput },
      created_at: nowIso(),
    });

    return {
      message: `Agent ${validatedName} started`,
      result,
    };
  } catch (error) {
    await logSystemEvent({
      agent_name: validatedName,
      event_type: "agent.error",
      payload: {
        trigger: "manual_api",
        input: validatedInput,
        message: error instanceof Error ? error.message : String(error),
      },
      created_at: nowIso(),
    });

    throw error;
  }
};
