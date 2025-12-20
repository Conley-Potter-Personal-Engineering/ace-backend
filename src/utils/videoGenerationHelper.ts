import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export interface VideoGenerationResult {
  buffer: Buffer;
  metadata: {
    duration: number;
    format: string;
    size: number;
  };
}

const sanitizeText = (value: unknown): string => {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.replace(/'/g, "\\'").replace(/:/g, "\\:");
};

/**
 * Generates a simple placeholder MP4 video from a structured render plan.
 *
 * @param plan Object containing title, tone, layout, duration, and styleTags that describe the render plan.
 * @returns Promise resolving with a video buffer and metadata { duration, format, size }.
 * @throws Error when ffmpeg fails to render or streaming errors occur.
 */
export async function generateVideoFromPlan(plan: any): Promise<VideoGenerationResult> {
  const duration =
    typeof plan?.duration === "number" && Number.isFinite(plan.duration) && plan.duration > 0
      ? plan.duration
      : 10;

  const titleText = sanitizeText(plan?.title ?? "Untitled Video");
  const toneText = sanitizeText(plan?.tone ?? "Tone: N/A");
  const layoutText = sanitizeText(plan?.layout ? `Layout: ${plan.layout}` : "");

  const overlayTone = `drawtext=fontcolor=white:fontsize=36:text='${toneText}':x=(w-text_w)/2:y=(h/2+text_h)`;
  const overlayTitle = `drawtext=fontcolor=white:fontsize=48:font=Helvetica:text='${titleText}':x=(w-text_w)/2:y=(h/2-2*text_h)`;
  const overlayLayout = layoutText
    ? `,drawtext=fontcolor=gray:fontsize=28:text='${layoutText}':x=(w-text_w)/2:y=h-(2*text_h)`
    : "";

  return new Promise<VideoGenerationResult>((resolve, reject) => {
    try {
      const command = ffmpeg()
        .input(`color=c=black:s=1280x720:d=${duration}`)
        .inputFormat("lavfi")
        .videoCodec("libx264")
        .noAudio()
        .duration(duration)
        .outputOptions([
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "frag_keyframe+empty_moov",
          "-vf",
          `${overlayTitle},${overlayTone}${overlayLayout}`,
        ])
        .format("mp4");

      const stream = new PassThrough();
      const chunks: Buffer[] = [];

      stream.on("data", (chunk) => chunks.push(chunk as Buffer));
      stream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          metadata: {
            duration,
            format: "mp4",
            size: buffer.length,
          },
        });
      });

      command.on("error", (error) => {
        reject(new Error(`Video generation failed: ${error.message}`));
      });

      command.pipe(stream, { end: true });
    } catch (error) {
      reject(
        new Error(
          `Video generation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  });
}

export default generateVideoFromPlan;
