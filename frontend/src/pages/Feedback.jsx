import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { generateFeedback, getInterviewSession } from "../services/api.js";
import { SETUP_DURATIONS } from "../utils/roleOptions.js";

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

  // Download PDF -- no new dependency, just a print-specific layout (see the
  // print:hidden / print:block classes below) and the browser's own
  // Save-as-PDF print destination.
  const handleDownloadPdf = () => {
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 print:py-0">
      {/* Print-only masthead -- the app header/nav is already hidden on this
          route, so this is the only branding a saved PDF carries. */}
      <div className="mb-6 hidden text-center print:block">
        <p className="text-sm font-bold tracking-wide text-slate-900">MockMate</p>
        <p className="text-xs text-slate-500">Interview feedback report &middot; {new Date().toLocaleDateString()}</p>
      </div>

      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
          {role}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Your interview feedback</h1>
      </div>

      <div className="card mt-8 print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-6 text-center sm:flex-row sm:text-left">
          {feedback.score != null && (
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-700 ring-4 ring-brand-100">
              {Math.round(feedback.score)}
            </div>
          )}
          <p className="text-slate-700">{feedback.summary}</p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Strengths</p>
            {feedback.strengths.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {feedback.strengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 flex-none text-emerald-500">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No specific strengths noted.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Areas to improve</p>
            {feedback.improvements.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {feedback.improvements.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 flex-none text-amber-500">
                      <path
                        d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.14A1 1 0 003 19.5h18a1 1 0 00.89-1.5L13.71 3.86a1 1 0 00-1.72 0z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No specific improvements noted.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 print:hidden sm:flex-row sm:flex-wrap">
        {session && (
          <button
            type="button"
            onClick={handlePracticeAgain}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
          >
            Practice this again
          </button>
        )}
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download PDF
        </button>
        <Link to="/start" className="text-sm font-semibold text-slate-600 hover:text-brand-600">
          Practice a different role
        </Link>
        <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-brand-600">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default Feedback;
