// Shared aggregate calculations over a list of interview session summaries
// (as returned by GET /interview/sessions), used by both the dashboard's
// stat cards and the profile menu's quick-stats row.

export function computeInterviewStats(sessions) {
  const completedCount = sessions.filter((session) => session.status === "completed").length;

  const scores = sessions
    .map((session) => session.score)
    .filter((score) => typeof score === "number");
  const averageScore = scores.length
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    : null;

  const roleCounts = new Map();
  for (const session of sessions) {
    roleCounts.set(session.role, (roleCounts.get(session.role) || 0) + 1);
  }
  let topRole = null;
  let topRoleCount = 0;
  for (const [role, count] of roleCounts) {
    if (count > topRoleCount) {
      topRole = role;
      topRoleCount = count;
    }
  }

  return { completedCount, averageScore, topRole };
}
