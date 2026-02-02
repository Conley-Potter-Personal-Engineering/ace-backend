export type SystemHealthStatus = "healthy" | "degraded" | "down";

export const determineSystemHealth = (
  criticalErrorCount: number,
  hasWorkflowFailures: boolean,
): SystemHealthStatus => {
  const safeCriticalErrors = Number.isFinite(criticalErrorCount)
    ? Math.max(0, criticalErrorCount)
    : 0;

  if (safeCriticalErrors > 5) {
    return "down";
  }

  if (safeCriticalErrors > 0 || hasWorkflowFailures) {
    return "degraded";
  }

  return "healthy";
};
