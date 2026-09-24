import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../components/common/Button.jsx";
import ChatBubble from "../components/interview/ChatBubble.jsx";
import InterviewRoomHeader from "../components/interview/InterviewRoomHeader.jsx";
import { getInterviewSession, getSessionQuestions, submitAnswer } from "../services/api.js";
import { cancelSpeech, isSpeechSupported, pauseSpeech, resumeSpeech, speak } from "../services/textToSpeech.js";

const TOTAL_QUESTIONS = 5; // mirrors MAX_QUESTIONS_PER_SESSION on the backend

// Phase 2 -- Feature 4 (room shell) + Feature 9 (AI Voice Output).
// Data-fetching/submit logic is unchanged from Feature 4 -- this adds the
// AI reading each new question aloud via the browser's built-in speech
// synthesis, with Mute / Pause / Replay controls. The text is always shown
// regardless of voice state, and voice support is feature-detected so the
// interview stays fully usable via text alone if it's unavailable.
//
// The live timer (Feature 5), the "thinking" state before a question
// appears (Feature 7), progressive live subtitles while speaking
// (Feature 10), and voice *input* (Feature 11) are separate, later passes.
function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Feature 9 -- AI Voice Output.
  const [voiceSupported] = useState(isSpeechSupported);
  const [muted, setMuted] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("idle"); // idle | speaking | paused
  const spokenQuestionIdRef = useRef(null);

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

  const answeredQuestions = questions.filter((q) => q.answer_text);
  const currentQuestion = questions.find((q) => !q.answer_text);
  const questionNumber = Math.min(answeredQuestions.length + 1, TOTAL_QUESTIONS);

  // Speak each new question exactly once, as soon as it appears -- not on
  // every re-render, and not the same question twice (e.g. after typing in
  // the answer box, which re-renders this component but isn't a new
  // question).
  useEffect(() => {
    if (!voiceSupported || muted || !currentQuestion) return;
    if (spokenQuestionIdRef.current === currentQuestion.id) return;
    spokenQuestionIdRef.current = currentQuestion.id;
    speak(currentQuestion.question_text, {
      onStart: () => setSpeechStatus("speaking"),
      onEnd: () => setSpeechStatus("idle"),
      onError: () => setSpeechStatus("idle"),
    });
  }, [currentQuestion, muted, voiceSupported]);

  // Stop any speech in progress if the student navigates away mid-question.
  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (next) {
        cancelSpeech();
        setSpeechStatus("idle");
      }
      return next;
    });
  };

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
                <div className="mt-2 flex flex-wrap items-center gap-4 pl-1 text-xs">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="font-semibold text-slate-500 transition hover:text-slate-800"
                  >
                    {muted ? "Unmute" : "Mute"}
                  </button>
                  {!muted && (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseResume}
                        disabled={speechStatus === "idle"}
                        className="font-semibold text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        {speechStatus === "paused" ? "Resume" : "Pause"}
                      </button>
                      <button
                        type="button"
                        onClick={handleReplay}
                        className="font-semibold text-slate-500 transition hover:text-slate-800"
                      >
                        Replay
                      </button>
                      {speechStatus === "speaking" && <span className="italic text-slate-400">Speaking...</span>}
                      {speechStatus === "paused" && <span className="italic text-slate-400">Paused</span>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {currentQuestion ? (
          <form onSubmit={handleSubmit} className="card mt-6">
            <label htmlFor="answer" className="field-label">
              Your answer
            </label>
            <textarea
              id="answer"
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              rows={6}
              placeholder="Type your answer here..."
              className="input-field mt-2 resize-none"
            />

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
