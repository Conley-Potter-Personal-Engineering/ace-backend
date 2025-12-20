import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "fs";

/**
 * Generates a video using the Gemini VEO 3.1 model.
 */
export async function generateVideoWithVeo(
  prompt: string,
  config?: { duration?: number; aspectRatio?: string; style?: string },
): Promise<{ buffer: Buffer; metadata: { duration?: number; format: string } }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY for Gemini VEO video generation");
    }

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let operation = await genAI.models.generateVideos({
      model: "gemini-veo-3.1",
      prompt,
      config: {
        durationSeconds: config?.duration ?? 10,
        aspectRatio: config?.aspectRatio ?? "16:9",
      },
    })

    // Poll the operation status until the video is ready.
    while (!operation.done) {
        console.log("Waiting for video generation to complete...")
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await genAI.operations.getVideosOperation({
            operation: operation,
        });
    }

    // Download the generated video (robustly handle missing fields and multiple response shapes).
    const response = operation.response;
    if (!response || !response.generatedVideos || response.generatedVideos.length === 0) {
      // Fallback: some responses may include a base64 payload directly on the response
      const maybeBase64 = (response as any)?.video;
      if (typeof maybeBase64 === "string") {
        const buffer = Buffer.from(maybeBase64, "base64");
        return {
          buffer,
          metadata: {
            format: "mp4",
            duration: config?.duration ?? 10,
          },
        };
      }
      throw new Error("Gemini VEO response missing generated videos");
    }

    const generated = response.generatedVideos[0] as any;
    // The downloadable file may be located under different keys depending on SDK version;
    // try common candidates and cast to any to satisfy the downloader.
    const downloadableFile = generated.video ?? generated.file ?? generated.uri ?? generated.downloadUrl ?? null;

    if (downloadableFile) {
      await genAI.files.download({
        file: downloadableFile as any,
        downloadPath: "dialogue_example.mp4",
      });
      const buffer = await fs.readFile("dialogue_example.mp4");
      return {
        buffer,
        metadata: {
          format: "mp4",
          duration: config?.duration ?? 10,
        },
      };
    }

    // Final fallback: check for a base64 payload on the response
    const base64Payload = (response as any).video;
    if (typeof base64Payload === "string") {
      const buffer = Buffer.from(base64Payload, "base64");
      return {
        buffer,
        metadata: {
          format: "mp4",
          duration: config?.duration ?? 10,
        },
      };
    }

    throw new Error("No downloadable video file or base64 payload found in Gemini VEO response");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini VEO video generation failed: ${message}`);
  }
}

export default generateVideoWithVeo;
