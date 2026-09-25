import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { generateFeedback, getInterviewSession } from "../services/api.js";
import { SETUP_DURATIONS } from "../utils/roleOptions.js";

// Score -> tone mapping, used everywhere the score shows up (the ring, the
// badge, the decorative glow). A meter-style read -- per the dataviz skill,
// severity rides the fill color, never the number alone.
function getScoreTone(score) {
  if (score == null) {
    return {
      label: "Pending",
      text: "text-slate-700",
      badge: "bg-slate-100 text-slate-600 ring-slate-200",
      stroke: "stroke-slate-300",
      glow: "bg-slate-200",
    };
  }
  if (score >= 75) {
    return {
      label: "Strong performance",
      text: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      stroke: "stroke-emerald-500",
      glow: "bg-emerald-200",
    };
  }
  if (score >= 50) {
    return {
      label: "Room to grow",
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700 ring-amber-100",
      stroke: "stroke-amber-500",
      glow: "bg-amber-200",
    };
  }
  return {
    label: "Needs work",
    text: "text-red-700",
    badge: "bg-red-50 text-red-700 ring-red-100",
    stroke: "stroke-red-500",
    glow: "bg-red-200",
  };
}

function formatSessionDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.14A1 1 0 003 19.5h18a1 1 0 00.89-1.5L13.71 3.86a1 1 0 00-1.72 0z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ShuffleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 6h3.5c2 0 3 .8 4 2.2M4 18h3.5c2 0 3-.8 4-2.2m0 0l6-8.8M20 6h-4.5m4.5 0v4.5M20 6l-4.8 6.6M20 18h-4.5m4.5 0v-4.5M20 18l-3-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Circular progress ring for the score -- more of a "meter" than a flat
// filled disc, and the one figure this page leads with.
function ScoreRing({ score, tone }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative h-32 w-32 flex-none">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-100" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={tone.stroke}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${tone.text}`}>{Math.round(score)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">out of 100</span>
      </div>
    </div>
  );
}

function Feedback() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState(null);
  const [role, setRole] = useState("");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data: sessionData } = await getInterviewSession(sessionId);
        if (cancelled) return;
        setRole(sessionData.role);
        setSession(sessionData);

        if (sessionData.status !== "completed") {
          navigate(`/interview/${sessionId}`, { replace: true });
          return;
        }

        const { data } = await generateFeedback(sessionId);
        if (!cancelled) setFeedback(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || "Couldn't load your feedback. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  // Practice this again -- skip the setup form entirely and jump straight
  // to the "before you begin" countdown, reusing the same role/type/
  // difficulty as last time. A short hint built from this session's
  // improvement areas rides along as job_description, so the next round of
  // questions leans into what needs more practice (the backend already
  // accepts job_description as optional, so this needs no API changes).
  const handlePracticeAgain = () => {
    if (!session) return;
    const hint =
      feedback?.improvements?.length > 0
        ? `This time, focus a little more on: ${feedback.improvements.join(", ")}.`
        : undefined;
    navigate("/interview/prepare", {
      state: {
        role: session.role,
        interviewType: session.interview_type,
        difficulty: session.difficulty,
        duration: SETUP_DURATIONS[1],
        jobDescriptionHint: hint,
      },
    });
  };

  // Download report -- no new dependency, just a print-specific layout (see
  // the print:hidden / print:block classes below) and the browser's own
  // Save-as-PDF print destination.
  const handleDownloadReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-sm text-slate-500">Analyzing your answers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <Link to="/start" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
          Start a new interview
        </Link>
      </div>
    );
  }

  const tone = getScoreTone(feedback.score);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 print:py-0">
      {/* Print-only masthead -- the app header/nav is already hidden on this
          route, so this is the only branding a saved report carries. */}
      <div className="mb-6 hidden text-center print:block">
        <p className="text-sm font-bold tracking-wide text-slate-900">MockMate</p>
        <p className="text-xs text-slate-500">Interview feedback report &middot; {new Date().toLocaleDateString()}</p>
      </div>

      <div className="animate-fade-up text-center">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
          {role}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Your interview feedback</h1>
      </div>

      {/* Hero -- the score ring, tone, and summary, wrapped in a card with a
          soft tone-colored glow behind it for a bit of personality without
          getting in the way of reading it. */}
      <div className="animate-fade-up-delay-1 relative mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8 print:border-0 print:p-0 print:shadow-none">
        <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full ${tone.glow} opacity-30 blur-3xl print:hidden`} />
        <div className={`pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-brand-200 opacity-20 blur-3xl print:hidden`} />

        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          {feedback.score != null && <ScoreRing score={feedback.score} tone={tone} />}
          <div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone.badge}`}>
              {tone.label}
            </span>
            <p className="mt-3 text-slate-700">{feedback.summary}</p>
          </div>
        </div>

        {session && (
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500 sm:justify-start">
            {session.interview_type && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 capitalize">
                {session.interview_type} interview
              </span>
            )}
            {session.difficulty && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 capitalize">
                {session.difficulty} difficulty
              </span>
            )}
            {session.topic && <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">{session.topic}</span>}
            {formatSessionDate(session.completed_at || session.created_at) && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">
                {formatSessionDate(session.completed_at || session.created_at)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Strengths / improvements -- their own scannable, tinted cards. */}
      <div className="animate-fade-up-delay-2 mt-6 grid gap-4 sm:grid-cols-2 print:grid-cols-1">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 print:border-slate-200 print:bg-white">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" />
            Strengths
          </p>
          {feedback.strengths.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {feedback.strengths.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No specific strengths noted.</p>
          )}
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 print:border-slate-200 print:bg-white">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
            <WarningIcon className="h-4 w-4" />
            Areas to improve
          </p>
          {feedback.improvements.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {feedback.improvements.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <WarningIcon className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No specific improvements noted.</p>
          )}
        </div>
      </div>

      {/* Primary next step -- ties the page off with a real recommendation
          instead of trailing into empty space. */}
      <div className="card mt-6 flex flex-col items-center gap-4 bg-gradient-to-br from-brand-50 to-white text-center print:hidden sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Ready to put this into practice?</h3>
          <p className="mt-1 text-sm text-slate-600">
            {feedback.improvements.length > 0
              ? `Run it back and focus on: ${feedback.improvements[0]}`
              : "Keep the momentum going with another mock interview."}
          </p>
        </div>
        {session && (
          <button
            type="button"
            onClick={handlePracticeAgain}
            className="inline-flex flex-none items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
          >
            Practice this again
          </button>
        )}
      </div>

      {/* Utility actions -- everything else (report export, more practice,
          leaving the page), kept visually quieter than the primary CTA
          above so the hierarchy stays clear. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <DownloadIcon className="h-4 w-4" />
          Download report
        </button>
        <Link
          to="/start"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
        >
          <ShuffleIcon className="h-4 w-4" />
          Practice a different role
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
        >
          <DashboardIcon className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default Feedback;
