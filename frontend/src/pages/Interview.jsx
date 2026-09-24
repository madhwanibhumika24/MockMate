import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../components/common/Button.jsx";
import ChatBubble from "../components/interview/ChatBubble.jsx";
import InterviewRoomHeader from "../components/interview/InterviewRoomHeader.jsx";
import { getInterviewSession, getSessionQuestions, submitAnswer } from "../services/api.js";
import { isRecognitionSupported, startRecognition } from "../services/speechToText.js";
import { cancelSpeech, isSpeechSupported, pauseSpeech, resumeSpeech, speak } from "../services/textToSpeech.js";
import { MicIcon, PauseIcon, PlayIcon, ReplayIcon } from "../components/interview/VoiceIcons.jsx";

const TOTAL_QUESTIONS = 5; // mirrors MAX_QUESTIONS_PER_SESSION on the backend

// Phase 2 -- Feature 4 (room shell) + Feature 9 (AI voice output) +
// Feature 11/12/13 (student voice input, live transcript, text fallback).
// Data-fetching/submit logic is unchanged from Feature 4.
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
// The live timer (Feature 5), the "thinking" state before a question
// appears (Feature 7), and progressive live subtitles while the AI is
// speaking (Feature 10) are separate, later passes.
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

        {currentQuestion ? (
          <form onSubmit={handleSubmit} className="card mt-6">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="answer" className="field-label !mb-0">
                Your answer
              </label>
              {voiceInputSupported && (
                <button
                  type="button"
                  onClick={listening ? handleStopListening : handleStartListening}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    listening
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {listening ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  ) : (
                    <MicIcon className="h-3.5 w-3.5" />
                  )}
                  {listening ? "Listening..." : "Start Speaking"}
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
