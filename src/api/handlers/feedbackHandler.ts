import { logSystemEvent } from "../../repos/systemEvents";
import { feedbackRequestSchema, type FeedbackRequest } from "../../schemas/apiSchemas";

export const recordFeedback = async (rawBody: unknown) => {
  const feedback: FeedbackRequest = feedbackRequestSchema.parse(rawBody ?? {});

  await logSystemEvent({
    agent_name: "FeedbackAPI",
    event_type: "feedback.recorded",
    payload: feedback,
    created_at: new Date().toISOString(),
  });

  return { message: "Feedback recorded" };
};
