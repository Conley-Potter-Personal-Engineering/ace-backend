import type { Tables } from "@/db/types";
import {
  fetchPerformanceMetricsBetween,
  fetchPublishedPostsPostedBetween,
  fetchScriptsCreatedBetween,
  fetchSystemEvents,
  fetchVideoAssetsCreatedBetween,
} from "@/repos/metricsSummary";
import {
  calculatePercentChange,
  calculatePerformanceScore,
  calculateTrendDirection,
  type TrendDirection,
} from "@/lib/api/utils/trendCalculation";
import {
  determineSystemHealth,
  type SystemHealthStatus,
} from "@/lib/api/utils/systemHealth";
import { MetricsSummaryQuerySchema } from "@/schemas/apiSchemas";

export type MetricsSummaryPeriod = "today" | "week" | "month";

export interface MetricsSummaryCounts {
  today: number;
  week: number;
  trend: TrendDirection;
}

export interface MetricsSummaryData {
  scripts_generated: MetricsSummaryCounts;
  assets_rendered: MetricsSummaryCounts;
  posts_published: MetricsSummaryCounts;
  avg_performance_score: {
    current: number;
    previous_period: number;
    change_percent: number;
  };
  system_health: SystemHealthStatus;
  active_workflows: number;
  recent_errors_24h: number;
}

const utcDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
) => new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));

const startOfUtcDay = (date: Date) =>
  utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const startOfUtcWeek = (date: Date) => {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  const start = startOfUtcDay(date);
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
};

const startOfUtcMonth = (date: Date) =>
  utcDate(date.getUTCFullYear(), date.getUTCMonth(), 1);

const lastDayOfMonthUtc = (year: number, month: number) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const buildPeriod = (period: MetricsSummaryPeriod, now: Date) => {
  if (period === "today") {
    return { start: startOfUtcDay(now), end: now };
  }

  if (period === "week") {
    return { start: startOfUtcWeek(now), end: now };
  }

  return { start: startOfUtcMonth(now), end: now };
};

const buildPreviousPeriod = (
  period: MetricsSummaryPeriod,
  now: Date,
  currentStart: Date,
  currentEnd: Date,
) => {
  if (period === "month") {
    const prevMonth = currentStart.getUTCMonth() - 1;
    const prevYear = prevMonth < 0 ? currentStart.getUTCFullYear() - 1 : currentStart.getUTCFullYear();
    const normalizedPrevMonth = (prevMonth + 12) % 12;

    const prevStart = utcDate(prevYear, normalizedPrevMonth, 1);
    const maxDay = lastDayOfMonthUtc(prevYear, normalizedPrevMonth);
    const day = Math.min(now.getUTCDate(), maxDay);
    const prevEnd = utcDate(
      prevYear,
      normalizedPrevMonth,
      day,
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    );

    return { start: prevStart, end: prevEnd };
  }

  const duration = currentEnd.getTime() - currentStart.getTime();

  if (period === "today") {
    const prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
    return { start: prevStart, end: new Date(prevStart.getTime() + duration) };
  }

  const prevStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start: prevStart, end: new Date(prevStart.getTime() + duration) };
};

const toIso = (date: Date) => date.toISOString();

const countRecords = (records: Array<{ created_at?: string | null }>) => records.length;

const buildCounts = (current: number, previous: number): MetricsSummaryCounts => ({
  today: current,
  week: previous,
  trend: calculateTrendDirection(current, previous, 0.1),
});

const averagePerformanceScore = (metrics: Tables<"performance_metrics">[]) => {
  if (!metrics.length) {
    return 0;
  }

  const total = metrics.reduce(
    (sum, metric) => sum + calculatePerformanceScore(metric),
    0,
  );

  return total / metrics.length;
};

const getWorkflowEventType = (event: Tables<"system_events">) =>
  (event.event_type ?? "").toLowerCase();

const isWorkflowStart = (eventType: string) => eventType === "workflow.start";

const isWorkflowEnd = (eventType: string) => eventType === "workflow.end";

const calculateActiveWorkflows = (events: Tables<"system_events">[]) => {
  const started = new Set<string>();
  const ended = new Set<string>();

  for (const event of events) {
    const workflowId = event.workflow_id ?? null;
    if (!workflowId) {
      continue;
    }

    const eventType = getWorkflowEventType(event);
    if (isWorkflowStart(eventType)) {
      started.add(workflowId);
    }

    if (isWorkflowEnd(eventType)) {
      ended.add(workflowId);
    }
  }

  let active = 0;
  for (const workflowId of started) {
    if (!ended.has(workflowId)) {
      active += 1;
    }
  }

  return active;
};

const hasWorkflowFailures = (events: Tables<"system_events">[]) =>
  events.some((event) => {
    const eventType = getWorkflowEventType(event);
    return eventType.includes("workflow") && eventType.includes("error");
  });

export const getMetricsSummary = async (
  rawQuery: Record<string, string | undefined>,
  now: Date = new Date(),
): Promise<MetricsSummaryData> => {
  const parsed = MetricsSummaryQuerySchema.parse(rawQuery);
  const period = parsed.period as MetricsSummaryPeriod;

  const currentPeriod = buildPeriod(period, now);
  const previousPeriod = buildPreviousPeriod(
    period,
    now,
    currentPeriod.start,
    currentPeriod.end,
  );

  // TODO: Add Redis caching (5 minute TTL) keyed by period.
  const [
    currentScripts,
    previousScripts,
    currentAssets,
    previousAssets,
    currentPosts,
    previousPosts,
    currentMetrics,
    previousMetrics,
  ] = await Promise.all([
    fetchScriptsCreatedBetween(toIso(currentPeriod.start), toIso(currentPeriod.end)),
    fetchScriptsCreatedBetween(toIso(previousPeriod.start), toIso(previousPeriod.end)),
    fetchVideoAssetsCreatedBetween(toIso(currentPeriod.start), toIso(currentPeriod.end)),
    fetchVideoAssetsCreatedBetween(toIso(previousPeriod.start), toIso(previousPeriod.end)),
    fetchPublishedPostsPostedBetween(toIso(currentPeriod.start), toIso(currentPeriod.end)),
    fetchPublishedPostsPostedBetween(toIso(previousPeriod.start), toIso(previousPeriod.end)),
    fetchPerformanceMetricsBetween(toIso(currentPeriod.start), toIso(currentPeriod.end)),
    fetchPerformanceMetricsBetween(toIso(previousPeriod.start), toIso(previousPeriod.end)),
  ]);

  const scriptsCounts = buildCounts(
    countRecords(currentScripts),
    countRecords(previousScripts),
  );
  const assetsCounts = buildCounts(
    countRecords(currentAssets),
    countRecords(previousAssets),
  );
  const postsCounts = buildCounts(
    countRecords(currentPosts),
    countRecords(previousPosts),
  );

  const currentAvgScore = averagePerformanceScore(currentMetrics);
  const previousAvgScore = averagePerformanceScore(previousMetrics);

  const currentHourStart = new Date(now.getTime() - 60 * 60 * 1000);
  const lastDayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    criticalErrorsLastHour,
    workflowEventsLastDay,
    workflowEventsLastHour,
    errorsLastDay,
  ] = await Promise.all([
    fetchSystemEvents({
      startDate: toIso(currentHourStart),
      endDate: toIso(now),
      severities: ["critical"],
    }),
    fetchSystemEvents({
      startDate: toIso(lastDayStart),
      endDate: toIso(now),
      eventTypeLike: "workflow",
    }),
    fetchSystemEvents({
      startDate: toIso(currentHourStart),
      endDate: toIso(now),
      eventTypeLike: "workflow",
    }),
    fetchSystemEvents({
      startDate: toIso(lastDayStart),
      endDate: toIso(now),
      severities: ["error", "critical"],
    }),
  ]);

  const workflowFailures = hasWorkflowFailures(workflowEventsLastHour);

  return {
    scripts_generated: scriptsCounts,
    assets_rendered: assetsCounts,
    posts_published: postsCounts,
    avg_performance_score: {
      current: currentAvgScore,
      previous_period: previousAvgScore,
      change_percent: calculatePercentChange(currentAvgScore, previousAvgScore),
    },
    system_health: determineSystemHealth(
      criticalErrorsLastHour.length,
      workflowFailures,
    ),
    active_workflows: calculateActiveWorkflows(workflowEventsLastDay),
    recent_errors_24h: errorsLastDay.length,
  };
};
