import { computeReadinessInsights } from "../../utils/interviewStats.js";

function ReadinessBar({ percent }) {
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-brand-600 transition-all"
        style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

function AreaChip({ label, avgScore, tone }) {
  const styles =
    tone === "weak"
      ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
      : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {label}
      <span className="font-normal opacity-80">{avgScore}/100</span>
    </span>
  );
}

function ReadinessInsights({ sessions }) {
  const hasAnySessions = sessions.length > 0;
  const insights = computeReadinessInsights(sessions);

  if (!hasAnySessions) return null;

  if (!insights) {
    return (
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Placement readiness</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Finish your first interview to see a readiness score and personalized recommendations here.
        </p>
      </div>
    );
  }

  const { readinessPercent, weakAreas, strongAreas, recommendation } = insights;

  return (
    <div className="card mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Placement readiness</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{recommendation}</p>

          {(weakAreas.length > 0 || strongAreas.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {weakAreas.map((area) => (
                <AreaChip key={`weak-${area.label}`} label={area.label} avgScore={area.avgScore} tone="weak" />
              ))}
              {strongAreas.map((area) => (
                <AreaChip key={`strong-${area.label}`} label={area.label} avgScore={area.avgScore} tone="strong" />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-none flex-col items-start sm:w-48 sm:items-end">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{readinessPercent}%</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Readiness score</p>
          <div className="mt-1 w-full">
            <ReadinessBar percent={readinessPercent} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadinessInsights;
