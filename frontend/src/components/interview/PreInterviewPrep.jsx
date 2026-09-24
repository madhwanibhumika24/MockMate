import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { createInterviewSession } from "../../services/api.js";
import Button from "../common/Button.jsx";

// Phase 2 -- Feature 2: exact calming copy from the spec, shown one at a
// time. Keep this short, professional and calm -- not childish.
const MESSAGES = [
  "Take a deep breath.",
  "Stay calm and think before answering.",
  "You don't need to rush.",
  "Explain your thinking clearly.",
  "If you don't know something, be honest.",
  "You've prepared for this.",
  "Good luck. You've got this.",
];

const COUNTDOWN_SECONDS = 15;
const SEGMENT_SECONDS = COUNTDOWN_SECONDS / MESSAGES.length;

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Phase 2 -- Feature 2: Pre-Interview Preparation screen. Sits between
// Interview Setup and the interview itself (and, once Feature 3's polished
// transition exists, hands off into that). Reads the config picked on the
// setup screen via router state.
//
// A single 15-second countdown drives both the circular timer and the
// calming-message sequence, so the two always stay in sync -- no separate
// timers to drift apart. When the countdown reaches zero the interview
// starts automatically; the "Begin Interview" button lets the student
// start sooner if they're ready, without waiting.
function PreInterviewPrep() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state;

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  // No config (e.g. a direct link or a page refresh that dropped router
  // state) -- send the student back to setup instead of showing a broken
  // screen.
  useEffect(() => {
    if (!config) {
      navigate("/start", { replace: true });
    }
  }, [config, navigate]);

  useEffect(() => {
    if (!config || secondsLeft <= 0 || startedRef.current) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (!startedRef.current) {
        setSecondsLeft((current) => current - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [config, secondsLeft]);

  const handleBegin = async () => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    setError("");
    setSubmitting(true);
    try {
      const { data } = await createInterviewSession({
        role: config.role,
        interview_type: config.interviewType,
        difficulty: config.difficulty,
      });
      navigate(`/interview/${data.id}`, { state: { durationMinutes: config.duration } });
    } catch (err) {
      startedRef.current = false;
      setError(err.response?.data?.detail || "Couldn't start the interview. Please try again.");
      setSubmitting(false);
    }
  };

  // Once the ring runs out, begin automatically -- same call the button
  // makes, guarded so it only ever fires once.
  useEffect(() => {
    if (config && secondsLeft === 0) {
      handleBegin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, config]);

  if (!config) {
    return null;
  }

  const elapsedSeconds = COUNTDOWN_SECONDS - secondsLeft;
  const messageIndex = Math.min(MESSAGES.length - 1, Math.floor(elapsedSeconds / SEGMENT_SECONDS));
  const ringOffset = RING_CIRCUMFERENCE * (1 - secondsLeft / COUNTDOWN_SECONDS);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-14 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Before you begin</p>
      <p className="mt-4 text-sm font-medium text-slate-500">Your interview begins in</p>

      <div className="relative mt-4 h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle cx="50" cy="50" r={RING_RADIUS} fill="none" strokeWidth="6" stroke="currentColor" className="text-slate-200" />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke="currentColor"
            className="text-brand-600"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-slate-900">
          {secondsLeft}
        </div>
      </div>

      <p
        key={messageIndex}
        className="animate-fade-up mt-8 min-h-[3.5rem] text-2xl font-semibold text-slate-900 sm:text-3xl"
      >
        {MESSAGES[messageIndex]}
      </p>

      {error && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Button type="button" loading={submitting} onClick={handleBegin} className="mt-10 w-full max-w-xs">
        {submitting ? "Starting interview..." : "Begin Interview"}
      </Button>
    </div>
  );
}

export default PreInterviewPrep;
