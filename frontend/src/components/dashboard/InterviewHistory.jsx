import { Link } from "react-router-dom";

const STATUS_STYLES = {
  created: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  in_progress: "bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300",
};

const STATUS_LABELS = {
  created: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  hard: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

const INTERVIEW_TYPE_LABELS = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  project: "Project Deep-Dive",
  system_design: "System Design",
  company: "Company-style",
  mixed: "Mixed",
};

function HistoryRow({ session }) {
  const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.created;
  const statusLabel = STATUS_LABELS[session.status] || session.status;
  const difficultyStyle = DIFFICULTY_STYLES[session.difficulty] || DIFFICULTY_STYLES.medium;

  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{session.role}</p>
          {session.interview_type && session.interview_type !== "technical" && (
            <span className="inline-flex flex-none items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {INTERVIEW_TYPE_LABELS[session.interview_type] || session.interview_type}
            </span>
          )}
          {session.topic && (
            <span className="inline-flex flex-none items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
              {session.topic}
            </span>
          )}
          {session.difficulty && (
            <span className={`inline-flex flex-none items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${difficultyStyle}`}>
              {session.difficulty}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatDate(session.created_at)}</p>
      </div>

      <div className="flex flex-none items-center gap-3">
        {typeof session.score === "number" && (
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{Math.round(session.score)}/100</span>
        )}
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}>
          {statusLabel}
        </span>
        {session.status === "completed" ? (
          <Link
            to={`/feedback/${session.id}`}
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            View feedback
          </Link>
        ) : (
          <Link
            to={`/interview/${session.id}`}
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            Resume
          </Link>
        )}
      </div>
    </div>
  );
}

function InterviewHistory({ sessions, loading }) {
  return (
    <div className="card mt-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your interviews</h3>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading your interview history...</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No interviews yet -- start your first one above to see it here.
        </p>
      ) : (
        <div className="mt-2">
          {sessions.map((session) => (
            <HistoryRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

export default InterviewHistory;
