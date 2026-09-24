// Shared aggregate calculations over a list of interview session summaries
// (as returned by GET /interview/sessions), used by the dashboard's stat
// cards, the placement-readiness insights, and the profile menu's
// quick-stats row.

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

// Minimum number of scored sessions in a topic/role group before we're
// willing to call it out as a "weak area" -- avoids labeling someone's
// single unlucky attempt as a persistent weakness.
const MIN_GROUP_SIZE_FOR_CALLOUT = 2;

// A group's average score has to fall at least this many points below the
// overall average to be flagged as weak (or above, to be flagged strong) --
// keeps near-uniform performance from producing noisy callouts.
const GAP_THRESHOLD = 8;

/**
 * Computes a placement-readiness snapshot from real interview history:
 * - readinessPercent: a recency-weighted average of scored sessions (recent
 *   interviews count more than older ones, so readiness reflects current
 *   skill, not a lifetime average).
 * - weakAreas / strongAreas: topic (or role, if no topic was set) groups
 *   whose average score is meaningfully below/above the overall average.
 * - recommendation: one plain-language next step.
 *
 * Returns null if there isn't at least one scored (completed + feedback
 * received) session yet -- there's nothing real to report.
 */
export function computeReadinessInsights(sessions) {
  const scored = sessions.filter((session) => typeof session.score === "number");
  if (scored.length === 0) return null;

  // Most recent first, so index 0 gets the highest recency weight.
  const byRecency = [...scored].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const window = byRecency.slice(0, 8);
  let weightedSum = 0;
  let weightTotal = 0;
  window.forEach((session, index) => {
    const weight = window.length - index; // linear recency decay
    weightedSum += session.score * weight;
    weightTotal += weight;
  });
  const readinessPercent = Math.round(weightedSum / weightTotal);

  const overallAverage = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;

  const groups = new Map();
  for (const session of scored) {
    const label = session.topic || session.role;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(session.score);
  }

  const groupStats = [...groups.entries()]
    .map(([label, scores]) => ({
      label,
      count: scores.length,
      avgScore: Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10,
    }))
    .filter((group) => group.count >= MIN_GROUP_SIZE_FOR_CALLOUT);

  const weakAreas = groupStats
    .filter((group) => overallAverage - group.avgScore >= GAP_THRESHOLD)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 2);

  const strongAreas = groupStats
    .filter((group) => group.avgScore - overallAverage >= GAP_THRESHOLD)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 2);

  let recommendation;
  if (scored.length < 3) {
    recommendation = "Complete a few more interviews to get a clearer readiness picture.";
  } else if (weakAreas.length > 0) {
    recommendation = `Focus on ${weakAreas[0].label} next -- your average score there is ${weakAreas[0].avgScore}/100.`;
  } else if (readinessPercent >= 80) {
    recommendation = "You're in strong shape. Try a Hard-difficulty session to keep pushing.";
  } else {
    recommendation = "Keep practicing consistently across roles to raise your readiness score.";
  }

  return { readinessPercent, scoredCount: scored.length, weakAreas, strongAreas, recommendation };
}
