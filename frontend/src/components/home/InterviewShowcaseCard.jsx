import { useEffect, useRef, useState } from "react";

import { MicIcon, PauseIcon, ReplayIcon, StopIcon } from "../interview/VoiceIcons.jsx";

// A non-interactive, always-safe recreation of the real interview room's
// chat area -- nothing here is clickable and no microphone/speech APIs are
// touched, so it never prompts a homepage visitor for permission or costs
// an API call. Plays out two full question-and-answer beats on a loop: the
// AI "speaks" a question (pause/replay controls, just like the real room),
// then the mic goes through Start Speaking -> Stop Recording, then that
// pair settles into the same answered-question layout the real interview
// room uses, before moving on to the next question.
const QUESTIONS = [
  {
    question: "Tell me about a time you fixed a tricky bug under pressure.",
    answer: "I found a race condition in the checkout flow, added proper locking, and shipped a fix within a day.",
  },
  {
    question: "How would you approach optimizing a slow-loading web page?",
    answer: "I'd profile load times first, then lazy-load images and split the JS bundle.",
  },
];

// One question's worth of timing, relative to when its AI bubble appears.
const STEP = {
  arrowControlsOut: 1300,
  speakEnd: 2600,
  micIn: 3100,
  arrowMicOut: 4150,
  listenStart: 4650,
  listenEnd: 7250,
  settle: 7800, // this question becomes "answered"; next question's clock starts here
};

function BigArrow({ className }) {
  return (
    <svg viewBox="0 0 60 28" className={className} fill="none" aria-hidden="true">
      <path
        d="M2 14h48m0 0l-12-11m12 11l-12 11"
        stroke="#2563EB"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VoiceControls({ speaking, showArrow }) {
  return (
    <div className="relative ml-9 mt-2 inline-flex items-center gap-3">
      {showArrow && (
        <span className="arrow-nudge-centered pointer-events-none absolute -left-14 top-1/2">
          <BigArrow className="h-6 w-11" />
        </span>
      )}
      <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          disabled
          tabIndex={-1}
          aria-hidden="true"
          className={`flex h-7 w-7 cursor-default items-center justify-center rounded-full transition ${
            speaking ? "text-slate-500" : "text-slate-300"
          }`}
        >
          <PauseIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled
          tabIndex={-1}
          aria-hidden="true"
          className="flex h-7 w-7 cursor-default items-center justify-center rounded-full text-slate-500"
        >
          <ReplayIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      {speaking && <span className="text-xs italic text-slate-400">Speaking...</span>}
    </div>
  );
}

function MicControl({ listening, showArrow }) {
  return (
    <div className="relative ml-9 mt-3 inline-flex flex-col items-start gap-1.5">
      {showArrow && (
        <span className="arrow-nudge pointer-events-none absolute -left-14 top-2">
          <BigArrow className="h-6 w-11" />
        </span>
      )}
      <span
        aria-hidden="true"
        className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md transition ${
          listening
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-green-300/50 bg-green-400/15 text-green-700 shadow-green-900/5"
        }`}
      >
        {!listening && (
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/50 to-transparent" />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">
          {listening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <StopIcon className="h-3 w-3" />
            </>
          ) : (
            <MicIcon className="h-3.5 w-3.5" />
          )}
          {listening ? "Stop Recording" : "Start Speaking"}
        </span>
      </span>
      {listening && <span className="pl-1 text-xs italic text-slate-400">Listening for your answer...</span>}
    </div>
  );
}

function AiBubble({ text }) {
  return (
    <div className="flex items-end gap-2">
      <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
        AI
      </span>
      <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm">
        <p className="mb-1 text-xs font-semibold text-slate-500">AI Interviewer</p>
        <p>{text}</p>
      </div>
    </div>
  );
}

function StudentBubble({ text }) {
  return (
    <div className="mt-3 flex flex-row-reverse items-end gap-2">
      <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600">
        ME
      </span>
      <div className="max-w-[85%] rounded-2xl bg-brand-600 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
        <p className="mb-1 text-xs font-semibold text-brand-100">You</p>
        <p>{text}</p>
      </div>
    </div>
  );
}

// answered: how many questions (from the start) have fully completed their
// AI + mic beat and settled into the static AI/ME bubble pair layout.
// active: which question index is currently mid-beat (null once both are
// answered, until the loop resets).
// beat: where the active question is within its own beat.
function InterviewShowcaseCard() {
  const [tick, setTick] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [active, setActive] = useState(0);
  const [beat, setBeat] = useState("speaking"); // speaking | speakingDone | micIdle | listening
  const [arrowOn, setArrowOn] = useState(true);
  const timersRef = useRef([]);

  useEffect(() => {
    function clearAll() {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    }
    function after(ms, fn) {
      timersRef.current.push(window.setTimeout(fn, ms));
    }

    clearAll();
    setAnswered(0);

    QUESTIONS.forEach((_, index) => {
      const base = index * STEP.settle;
      after(base, () => {
        setActive(index);
        setBeat("speaking");
        setArrowOn(true);
      });
      after(base + STEP.arrowControlsOut, () => setArrowOn(false));
      after(base + STEP.speakEnd, () => setBeat("speakingDone"));
      after(base + STEP.micIn, () => {
        setBeat("micIdle");
        setArrowOn(true);
      });
      after(base + STEP.arrowMicOut, () => setArrowOn(false));
      after(base + STEP.listenStart, () => setBeat("listening"));
      after(base + STEP.listenEnd, () => setBeat("done"));
      after(base + STEP.settle, () => setAnswered(index + 1));
    });

    after(QUESTIONS.length * STEP.settle + 400, () => setTick((n) => n + 1));

    return clearAll;
  }, [tick]);

  return (
    <div className="animate-float card mx-auto max-w-md overflow-visible rotate-1 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Live interview room</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">Ask, answer, done</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Preview</span>
      </div>

      <div className="mt-5 space-y-5 pl-2">
        {QUESTIONS.map((q, index) => {
          if (index >= answered && index !== active) return null;

          if (index < answered) {
            return (
              <div key={q.question}>
                <AiBubble text={q.question} />
                <StudentBubble text={q.answer} />
              </div>
            );
          }

          return (
            <div key={q.question}>
              <AiBubble text={q.question} />
              <VoiceControls speaking={beat === "speaking"} showArrow={arrowOn && beat === "speaking"} />
              {(beat === "micIdle" || beat === "listening" || beat === "done") && (
                <MicControl listening={beat === "listening"} showArrow={arrowOn && beat === "micIdle"} />
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .arrow-nudge { animation: nudgeRight 1s ease-in-out infinite; }
        .arrow-nudge-centered { animation: nudgeRightCentered 1s ease-in-out infinite; }
        @keyframes nudgeRight { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
        @keyframes nudgeRightCentered {
          0%, 100% { transform: translate(0, -50%); }
          50% { transform: translate(6px, -50%); }
        }
      `}</style>
    </div>
  );
}

export default InterviewShowcaseCard;
