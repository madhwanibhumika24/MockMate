import { Link } from "react-router-dom";

const STATUS_STYLES = {
  created: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
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
  easy: "bg-emerald-50 text-emerald-600",
  medium: "bg-amber-50 text-amber-600",
  hard: "bg-red-50 text-red-600",
};

const INTERVIEW_TYPE_LABELS = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  project: "Project Deep-Dive",
  system_design: "System Design",
  mixed: "Mixed",
};

function HistoryRow({ session }) {
  const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.created;
  const statusLabel = STATUS_LABELS[session.status] || session.status;
  const difficultyStyle = DIFFICULTY_STYLES[session.difficulty] || DIFFICULTY_STYLES.medium;

  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-slate-900">{session.role}</p>
          {session.interview_type && session.interview_type !== "technical" && (
            <span className="inline-flex flex-none items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {INTERVIEW_TYPE_LABELS[session.interview_type] || session.interview_type}
            </span>
          )}
          {session.topic && (
            <span className="inline-flex flex-none items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              {session.topic}
            </span>
          )}
          {session.difficulty && (
            <span className={`inline-flex flex-none items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${difficultyStyle}`}>
              {session.difficulty}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{formatDate(session.created_at)}</p>
      </div>

      <div className="flex flex-none items-center gap-3">
        {typeof session.score === "number" && (
          <span className="text-sm font-semibold text-slate-700">{Math.round(session.score)}/100</span>
        )}
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}>
          {statusLabel}
        </span>
        {session.status === "completed" ? (
          <Link
            to={`/feedback/${session.id}`}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View feedback
          </Link>
        ) : (
          <Link
            to={`/interview/${session.id}`}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
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
      <h3 className="text-lg font-semibold text-slate-900">Your interviews</h3>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading your interview history...</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
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
