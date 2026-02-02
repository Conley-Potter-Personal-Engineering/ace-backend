export type TrendDirection = "up" | "down" | "stable";

const toNumber = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const calculatePercentChange = (current: number, previous: number): number => {
  const safePrevious = toNumber(previous);
  const safeCurrent = toNumber(current);

  if (safePrevious === 0) {
    return 0;
  }

  return ((safeCurrent - safePrevious) / safePrevious) * 100;
};

export const calculateTrendDirection = (
  current: number,
  previous: number,
  threshold = 0.1,
): TrendDirection => {
  const safePrevious = toNumber(previous);
  const safeCurrent = toNumber(current);

  if (safePrevious === 0) {
    return safeCurrent === 0 ? "stable" : "up";
  }

  const changeRatio = (safeCurrent - safePrevious) / safePrevious;

  if (changeRatio >= threshold) {
    return "up";
  }

  if (changeRatio <= -threshold) {
    return "down";
  }

  return "stable";
};

export const calculatePerformanceScore = (metric: {
  view_count?: number | null;
  like_count?: number | null;
  comment_count?: number | null;
  share_count?: number | null;
}): number =>
  toNumber(metric.view_count) * 0.3 +
  toNumber(metric.like_count) * 2 +
  toNumber(metric.comment_count) * 3 +
  toNumber(metric.share_count) * 4;
