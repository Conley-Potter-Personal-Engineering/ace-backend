import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "veo-3.1" });

    const result = await model.generateVideo({
      prompt,
      config: {
        durationSeconds: config?.duration ?? 10,
        aspectRatio: config?.aspectRatio ?? "16:9",
      },
    });

    const videoData = result.video;
    if (!videoData || typeof videoData !== "string") {
      throw new Error("Gemini VEO response missing base64 video payload");
    }

    const buffer = Buffer.from(videoData, "base64");
    return {
      buffer,
      metadata: {
        format: "mp4",
        duration: config?.duration ?? 10,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini VEO video generation failed: ${message}`);
  }
}

export default generateVideoWithVeo;
