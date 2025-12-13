import BaseAgent from "./BaseAgent";
import type { Tables } from "../db/types";
import { getScriptById } from "../repos";
import {
  editorAgentInputSchema,
  type EditorAgentInput,
} from "../schemas/agentSchemas";
import {
  renderVideoAsset,
  type RenderedAssetResult,
} from "../services/editorService";

export interface EditorAgentResult {
  assetId: string;
  asset: Tables<"video_assets">;
  metadata: RenderedAssetResult["metadata"];
}

export class EditorAgent extends BaseAgent {
  constructor({ agentName = "EditorAgent" } = {}) {
    super(agentName);
  }

  async run(rawInput: EditorAgentInput): Promise<EditorAgentResult> {
    try {
      const input = editorAgentInputSchema.parse(rawInput);
      await this.logEvent("video.render.start", { scriptId: input.scriptId });

      const script = await getScriptById(input.scriptId);
      if (!script) {
        await this.logEvent("video.render.error", {
          scriptId: input.scriptId,
          message: "Script not found",
        });
        throw new Error(`Script ${input.scriptId} not found`);
      }

      await this.logEvent("context.script_loaded", {
        scriptId: script.script_id,
        productId: script.product_id,
      });

      const { asset, metadata } = await renderVideoAsset({
        script,
        overrideStoragePath: input.overrideStoragePath,
      });

      await this.logEvent("video.assets.created", {
        assetId: asset.asset_id,
        scriptId: script.script_id,
        storagePath: asset.storage_path,
      });

      const note = await this.storeNote(
        "video_render",
        `Rendered asset ${asset.asset_id} for script ${script.script_id}`,
      );
      await this.logEvent("memory.note_stored", {
        noteId: note.note_id,
        assetId: asset.asset_id,
      });

      await this.logEvent("video.render.success", {
        scriptId: script.script_id,
        assetId: asset.asset_id,
      });

      return {
        assetId: asset.asset_id,
        asset,
        metadata,
      };
    } catch (error) {
      await this.logEvent("video.render.error", {
        message: error instanceof Error ? error.message : String(error),
      });
      return this.handleError("EditorAgent.run", error);
    }
  }
}

export default EditorAgent;
