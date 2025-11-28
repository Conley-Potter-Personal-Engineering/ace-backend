import { fetchRecentSystemEvents } from "../../repos/systemEvents";
import { systemEventsQuerySchema } from "../../schemas/apiSchemas";

export const listSystemEventsApi = async (
  rawQuery: Record<string, string | undefined>,
) => {
  const parsed = systemEventsQuerySchema.parse(rawQuery);
  const limit = parsed.limit ?? 50;
  const events = await fetchRecentSystemEvents(limit);
  return events;
};
