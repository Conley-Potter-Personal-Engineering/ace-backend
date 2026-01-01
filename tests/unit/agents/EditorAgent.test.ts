import { describe, expect, it, vi } from "vitest";
import { buildScript } from "../../utils/factories/scriptFactory";

const mockScript = buildScript();
const mockVideoBuffer = Buffer.from("fakeVideo");
const mockStorageUrl = "https://mock.storage/video.mp4";

vi.mock("../../../src/llm/chains/editorChain", () => ({
  default: vi.fn(async () => ({
    storagePath: "videos/rendered/mock.mp4",
    thumbnailPath: "videos/rendered/mock.jpg",
    durationSeconds: 42,
    metadata: {
      title: "Edited Video",
      summary: "A concise short-form cut",
      beats: [
        {
          timestamp: "0-5s",
          visual: "Hook visual",
          narration: "Opening hook",
        },
      ],
      soundtrack: "Energetic backing track",
      transitions: "Quick cuts",
    },
    styleTags: ["cinematic"],
    mockVideo: "mockVideo",
  })),
}));

const generateVideoWithVeoMock = vi.fn(async () => ({
  buffer: mockVideoBuffer,
  metadata: { duration: 42, format: "mp4" },
}));

vi.mock("../../../src/utils/veoVideoGenerator", () => ({
  generateVideoWithVeo: generateVideoWithVeoMock,
  default: generateVideoWithVeoMock,
}));

vi.mock("../../../src/repos/storage", () => ({
  uploadRenderedVideo: vi.fn(async () => ({
    url: mockStorageUrl,
    backend: "supabase",
    attempts: 1,
  })),
}));

vi.mock("../../../src/repos/scripts", () => ({
  findById: vi.fn(async () => mockScript),
}));

vi.mock("../../../src/repos/videoAssets", () => ({
  create: vi.fn(async (payload) => ({
    asset: {
      ...payload,
      id: "asset-id",
      styleTags: payload.styleTags ?? [],
    },
    record: {
      asset_id: "asset-id",
      script_id: payload.scriptId,
      storage_path: payload.storageUrl,
      duration_seconds: payload.duration,
      thumbnail_path: null,
      created_at: new Date().toISOString(),
    },
  })),
}));

vi.mock("../../../src/repos/systemEvents", () => ({
  logSystemEvent: vi.fn(async ({ event_type, agent_name, payload, created_at }) => ({
    event_id: "event-id",
    agent_name: agent_name ?? "EditorAgent",
    event_type,
    payload: payload ?? null,
    created_at: created_at ?? new Date().toISOString(),
  })),
}));

const { logSystemEvent } = await import("../../../src/repos/systemEvents");
const { generateVideoWithVeo } = await import("../../../src/utils/veoVideoGenerator");
const { uploadRenderedVideo } = await import("../../../src/repos/storage");
const { create: createVideoAsset } = await import("../../../src/repos/videoAssets");
const { EditorAgent } = await import("../../../src/agents/EditorAgent");

describe("EditorAgent", () => {
  it("renders a video asset from a script using VEO and logs workflow events", async () => {
    const agentName = "EditorAgentTest";
    const agent = new EditorAgent({ agentName });

    const result = await agent.run({
      scriptId: mockScript.script_id,
      composition: {
        duration: 42,
        tone: "energetic",
        layout: "montage",
      },
      renderBackend: "supabase",
    });

    const expectedPrompt =
      "Generate a 42-second energetic video in montage layout about: A concise short-form cut.";

    expect(generateVideoWithVeo).toHaveBeenCalledWith(expectedPrompt, {
      duration: 42,
    });
    expect(uploadRenderedVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        file: mockVideoBuffer,
        backend: "supabase",
        key: "videos/rendered/mock.mp4",
      }),
    );
    expect(createVideoAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        scriptId: mockScript.script_id,
        storageUrl: mockStorageUrl,
        duration: 42,
        tone: "energetic",
        layout: "montage",
        styleTags: ["cinematic"],
      }),
    );

    const loggedEvents = vi.mocked(logSystemEvent).mock.calls.map(
      ([payload]) => payload.event_type,
    );
    expect(loggedEvents).toContain("agent.start");
    expect(loggedEvents).toContain("video.render.start");
    expect(loggedEvents).toContain("video.render.progress");
    expect(loggedEvents).toContain("video.assets.uploaded");
    expect(loggedEvents).toContain("video.render.success");
    expect(loggedEvents).toContain("video.assets.created");
    expect(loggedEvents).toContain("video.generate.start");
    expect(loggedEvents).toContain("video.generate.success");
    expect(loggedEvents).toContain("agent.success");

    expect(result.storageUrl).toBe(mockStorageUrl);
    expect(result.asset.styleTags).toEqual(["cinematic"]);
    expect(result.asset.tone).toBe("energetic");
  });
});
