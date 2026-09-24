import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import Button from "../components/common/Button.jsx";
import ChatBubble from "../components/interview/ChatBubble.jsx";
import InterviewRoomHeader from "../components/interview/InterviewRoomHeader.jsx";
import { endInterviewSession, getInterviewSession, getSessionQuestions, submitAnswer } from "../services/api.js";
import { isRecognitionSupported, startRecognition } from "../services/speechToText.js";
import { cancelSpeech, isSpeechSupported, pauseSpeech, resumeSpeech, speak } from "../services/textToSpeech.js";
import { MicIcon, PauseIcon, PlayIcon, ReplayIcon, StopIcon } from "../components/interview/VoiceIcons.jsx";
import { SETUP_DURATIONS } from "../utils/roleOptions.js";

const TOTAL_QUESTIONS = 5; // mirrors MAX_QUESTIONS_PER_SESSION on the backend

// Used when a session is opened without the setup screen's router state
// (e.g. a page refresh, or a direct link) -- matches InterviewSetup's own
// default duration so the timer still shows something sensible.
const DEFAULT_DURATION_MINUTES = SETUP_DURATIONS[1];

// mm:ss, e.g. 125 -> "2:05". Never negative -- callers clamp secondsLeft to 0.
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Phase 2 -- Feature 4 (room shell) + Feature 5 (interview timer) +
// Feature 9 (AI voice output) + Feature 11/12/13 (student voice input, live
// transcript, text fallback). Data-fetching/submit logic is unchanged from
// Feature 4.
//
// Voice input: tapping the mic starts the browser's built-in speech
// recognition; interim (not-yet-final) words show in a separate, visually
// distinct line above the answer box so it's never mistaken for the actual
// submitted answer; each finalized chunk is appended into the real answer
// text area, which the student can still edit, add to by typing, or use
// on its own -- voice is never required to finish the interview. If the
// browser doesn't support it, or mic permission is denied, the mic button
// is hidden/disabled and a small message explains it -- text still works.
//
// Timer: counts down from the duration chosen on the setup screen. Right
// now it's a hard cap layered on top of the backend's still-fixed 5
// questions -- if all 5 get answered first, the interview ends the normal
// way; if time runs out first, it ends early via endInterviewSession()
// (marks the session "completed" without needing every question answered)
// and heads straight to feedback with whatever was captured so far.
//
// The "thinking" state before a question appears (Feature 7) and
// progressive live subtitles while the AI is speaking (Feature 10) are
// separate, later passes.
function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Feature 5 -- Interview Timer. durationMinutes comes from the setup
  // screen via router state (see InterviewSetup.jsx -> PreInterviewPrep.jsx);
  // falls back to the setup screen's own default if that state is missing
  // (e.g. a page refresh dropped it).
  const durationMinutes = location.state?.durationMinutes || DEFAULT_DURATION_MINUTES;
  const [secondsLeft, setSecondsLeft] = useState(() => durationMinutes * 60);
  const [timeUp, setTimeUp] = useState(false);
  const endingRef = useRef(false);

  // Feature 9 -- AI Voice Output.
  const [voiceSupported] = useState(isSpeechSupported);
  const [speechStatus, setSpeechStatus] = useState("idle"); // idle | speaking | paused
  const spokenQuestionIdRef = useRef(null);

  // Feature 11/12 -- Student Voice Input + Live Transcript.
  const [voiceInputSupported] = useState(isRecognitionSupported);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [sessionRes, questionsRes] = await Promise.all([
          getInterviewSession(sessionId),
          getSessionQuestions(sessionId),
        ]);
        if (cancelled) return;

        const sorted = [...questionsRes.data].sort((a, b) => a.order_index - b.order_index);
        setSession(sessionRes.data);
        setQuestions(sorted);

        const stillHasOpenQuestion = sorted.some((q) => !q.answer_text);
        if (sessionRes.data.status === "completed" && !stillHasOpenQuestion) {
          navigate(`/feedback/${sessionId}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.response?.data?.detail || "Couldn't load this interview session.");
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

  // Feature 5 -- Interview Timer. One ticking clock for the whole session,
  // started once the session/questions have loaded; stopped once the
  // interview is over (either normally, via handleSubmit below, or because
  // time ran out, via handleTimeUp) so it never ticks past zero or after
  // navigating away.
  useEffect(() => {
    if (loading || loadError || endingRef.current) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading, loadError]);

  const handleTimeUp = async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setTimeUp(true);

    // Stop anything voice-related immediately -- there's no point the AI
    // still talking or the mic still listening once time's up.
    cancelSpeech();
    recognitionRef.current?.stop();
    setListening(false);

    try {
      await endInterviewSession(sessionId);
    } catch {
      // Best-effort -- head to feedback regardless. Worst case the backend
      // still has the session as "in_progress" and feedback generation
      // fails there too, but that's no worse than not trying.
    }
    navigate(`/feedback/${sessionId}`);
  };

  // Fires exactly once, the moment the clock hits zero.
  useEffect(() => {
    if (secondsLeft === 0 && !timeUp && !endingRef.current) {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const answeredQuestions = questions.filter((q) => q.answer_text);
  const currentQuestion = questions.find((q) => !q.answer_text);
  const questionNumber = Math.min(answeredQuestions.length + 1, TOTAL_QUESTIONS);

  // Speak each new question exactly once, as soon as it appears -- not on
  // every re-render, and not the same question twice (e.g. after typing in
  // the answer box, which re-renders this component but isn't a new
  // question).
  useEffect(() => {
    if (!voiceSupported || !currentQuestion) return;
    if (spokenQuestionIdRef.current === currentQuestion.id) return;
    spokenQuestionIdRef.current = currentQuestion.id;
    speak(currentQuestion.question_text, {
      onStart: () => setSpeechStatus("speaking"),
      onEnd: () => setSpeechStatus("idle"),
      onError: () => setSpeechStatus("idle"),
    });
  }, [currentQuestion, voiceSupported]);

  // Stop any speech in progress if the student navigates away mid-question.
  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const handlePauseResume = () => {
    if (speechStatus === "speaking") {
      pauseSpeech();
      setSpeechStatus("paused");
    } else if (speechStatus === "paused") {
      resumeSpeech();
      setSpeechStatus("speaking");
    }
  };

  const handleReplay = () => {
    if (!currentQuestion) return;
    speak(currentQuestion.question_text, {
      onStart: () => setSpeechStatus("speaking"),
      onEnd: () => setSpeechStatus("idle"),
      onError: () => setSpeechStatus("idle"),
    });
  };

  // Stop any in-progress recognition if the student navigates away.
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const handleStartListening = () => {
    // Stop the AI from speaking first -- otherwise the mic can pick up the
    // question being read aloud through the speakers and transcribe that
    // instead of the student's actual answer.
    cancelSpeech();
    setSpeechStatus("idle");
    setMicError("");
    setInterimTranscript("");
    setListening(true);
    recognitionRef.current = startRecognition({
      onInterimResult: (text) => setInterimTranscript(text),
      onFinalResult: (text) => {
        const chunk = text.trim();
        if (!chunk) return;
        setAnswerText((prev) => (prev.trim() ? `${prev.trim()} ${chunk}` : chunk));
        setInterimTranscript("");
      },
      onEnd: () => {
        setListening(false);
        setInterimTranscript("");
      },
      onError: (errorType) => {
        setListening(false);
        setInterimTranscript("");
        if (errorType === "not-allowed" || errorType === "service-not-allowed") {
          setMicError("Microphone access was blocked. You can still type your answer below.");
        } else if (errorType === "unsupported") {
          setMicError("Voice input isn't supported in this browser. You can still type your answer below.");
        } else if (errorType === "no-speech") {
          setMicError("Didn't catch that -- try again, or type your answer instead.");
        } else {
          setMicError("Voice input stopped unexpectedly. You can still type your answer below.");
        }
      },
    });
  };

  const handleStopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentQuestion) return;
    if (!answerText.trim()) {
      setSubmitError("Please write an answer before submitting.");
      return;
    }

    setSubmitError("");
    setSubmitting(true);
    try {
      const { data } = await submitAnswer(sessionId, {
        session_id: Number(sessionId),
        question_id: currentQuestion.id,
        answer_text: answerText.trim(),
      });

      const answeredText = answerText.trim();
      setAnswerText("");

      setQuestions((prev) => {
        const updated = prev.map((q) =>
          q.id === currentQuestion.id ? { ...q, answer_text: answeredText } : q,
        );
        return data.next_question ? [...updated, data.next_question] : updated;
      });

      if (data.status === "completed") {
        endingRef.current = true;
        navigate(`/feedback/${sessionId}`);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.detail || "Couldn't submit your answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-sm text-slate-500">Loading your interview...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <Link to="/start" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
          Start a new interview
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <InterviewRoomHeader
        role={session?.role}
        interviewType={session?.interview_type}
        difficulty={session?.difficulty}
        questionNumber={questionNumber}
        totalQuestions={TOTAL_QUESTIONS}
        timeLabel={formatTime(secondsLeft)}
        isTimeCritical={secondsLeft <= 60}
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          {answeredQuestions.map((q) => (
            <div key={q.id} className="space-y-4">
              <ChatBubble from="ai">{q.question_text}</ChatBubble>
              <ChatBubble from="student">{q.answer_text}</ChatBubble>
            </div>
          ))}
          {currentQuestion && (
            <div>
              <ChatBubble from="ai">{currentQuestion.question_text}</ChatBubble>
              {voiceSupported && (
                <div className="ml-9 mt-2 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={handlePauseResume}
                      disabled={speechStatus === "idle"}
                      title={speechStatus === "paused" ? "Play" : "Pause"}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                    >
                      {speechStatus === "paused" ? (
                        <PlayIcon className="h-3.5 w-3.5" />
                      ) : (
                        <PauseIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleReplay}
                      title="Replay"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                      <ReplayIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {speechStatus === "speaking" && (
                    <span className="text-xs italic text-slate-400">Speaking...</span>
                  )}
                  {speechStatus === "paused" && <span className="text-xs italic text-slate-400">Paused</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {timeUp ? (
          <div className="card mt-6 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Time&apos;s up!</p>
            <p className="mt-1 text-sm text-slate-500">Wrapping up your interview and preparing your feedback...</p>
          </div>
        ) : currentQuestion ? (
          <form onSubmit={handleSubmit} className="card mt-6">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="answer" className="field-label !mb-0">
                Your answer
              </label>
              {voiceInputSupported && (
                <button
                  type="button"
                  onClick={listening ? handleStopListening : handleStartListening}
                  disabled={!listening && speechStatus === "speaking"}
                  title={
                    listening
                      ? "Stop recording"
                      : speechStatus === "speaking"
                        ? "Wait for the question to finish playing"
                        : "Start speaking"
                  }
                  className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md transition ${
                    listening
                      ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                      : speechStatus === "speaking"
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : "border-green-300/50 bg-green-400/15 text-green-700 shadow-green-900/5 hover:bg-green-400/25"
                  }`}
                >
                  {!listening && speechStatus !== "speaking" && (
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
                    {listening ? "Stop Recording" : speechStatus === "speaking" ? "Wait..." : "Start Speaking"}
                  </span>
                </button>
              )}
            </div>

            {listening && (
              <p className="mt-2 min-h-[1.5rem] rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-500">
                {interimTranscript || "Listening for your answer..."}
              </p>
            )}

            <textarea
              id="answer"
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              rows={6}
              placeholder="Type your answer here, or use the mic above."
              className="input-field mt-2 resize-none"
            />

            {micError && <p className="mt-2 text-xs text-slate-500">{micError}</p>}

            {submitError && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
            )}

            <div className="mt-4 flex justify-end">
              <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                {questionNumber >= TOTAL_QUESTIONS ? "Finish interview" : "Submit answer"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="card mt-6 text-center text-slate-600">Wrapping up your interview...</div>
        )}
      </div>
    </div>
  );
}

export default Interview;
