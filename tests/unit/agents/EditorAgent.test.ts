import { describe, expect, it, vi } from "vitest";
import { EditorAgent } from "../../../src/agents/EditorAgent";
import { buildAgentNote } from "../../utils/factories/agentNoteFactory";
import { buildScript } from "../../utils/factories/scriptFactory";

vi.mock("../../../src/repos/systemEvents", () => ({
  logSystemEvent: vi.fn(async ({ event_type }) => ({
    event_id: "event-id",
    agent_name: "EditorAgent",
    event_type,
    payload: null,
    created_at: new Date().toISOString(),
  })),
}));

const mockNote = buildAgentNote({ agent_name: "EditorAgent" });
const mockScript = buildScript();
const mockAsset = {
  asset_id: "asset-id",
  created_at: new Date().toISOString(),
  duration_seconds: 42,
  script_id: mockScript.script_id,
  storage_path: "videos/rendered/asset-id.mp4",
  thumbnail_path: "videos/thumbnails/asset-id.jpg",
};

vi.mock("../../../src/repos/agentNotes", () => ({
  createAgentNote: vi.fn(async () => mockNote),
}));

vi.mock("../../../src/repos", () => ({
  getScriptById: vi.fn(async () => mockScript),
}));

vi.mock("../../../src/services/editorService", () => ({
  renderVideoAsset: vi.fn(async () => ({
    asset: mockAsset,
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
  })),
}));

const { logSystemEvent } = await import("../../../src/repos/systemEvents");
const { getScriptById } = await import("../../../src/repos");
const { renderVideoAsset } = await import("../../../src/services/editorService");

describe("EditorAgent", () => {
  it("renders a video asset from a script and logs workflow events", async () => {
    const agentName = "EditorAgentTest";
    const agent = new EditorAgent({ agentName });

    const result = await agent.execute({
      scriptId: mockScript.script_id,
      overrideStoragePath: "videos/custom-path.mp4",
    });

    expect(getScriptById).toHaveBeenCalledWith(mockScript.script_id);
    expect(renderVideoAsset).toHaveBeenCalledWith({
      script: mockScript,
      overrideStoragePath: "videos/custom-path.mp4",
    });

    const loggedEvents = vi.mocked(logSystemEvent).mock.calls.map(
      ([payload]) => payload.event_type,
    );
    expect(loggedEvents).toContain("start");
    expect(loggedEvents).toContain("video.render.start");
    expect(loggedEvents).toContain("video.render.success");

    const typedResult = result as { assetId: string; asset: typeof mockAsset };
    expect(typedResult.assetId).toBe(mockAsset.asset_id);
    expect(typedResult.asset).toEqual(mockAsset);
  });
});
