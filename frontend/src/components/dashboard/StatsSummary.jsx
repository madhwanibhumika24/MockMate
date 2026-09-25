import { computeInterviewStats } from "../../utils/interviewStats.js";

function StatCard({ label, value }) {
  return (
    <div className="card py-5 sm:py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function StatsSummary({ sessions }) {
  if (sessions.length === 0) return null;

  const { completedCount, averageScore, topRole } = computeInterviewStats(sessions);

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Interviews completed" value={completedCount} />
      <StatCard label="Average score" value={averageScore !== null ? `${averageScore}/100` : "—"} />
      <StatCard label="Most practiced role" value={topRole || "—"} />
    </div>
  );
}

export default StatsSummary;
