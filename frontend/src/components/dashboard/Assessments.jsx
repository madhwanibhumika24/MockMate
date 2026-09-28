import { useEffect, useState } from "react";

import { generateAptitudeQuiz, listAptitudeCategories, listAptitudeTopics, submitAptitudeQuiz } from "../../services/api.js";
import Button from "../common/Button.jsx";

const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const QUESTION_COUNTS = [5, 10];

function BackIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
      <path d="M8 12.3l2.6 2.6L16 9.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LightbulbIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 00-6 6c0 2.2 1.1 3.6 2.1 4.6.6.6 1 1.4 1.1 2.4h5.6c.1-1 .5-1.8 1.1-2.4C17 12.6 18 11.2 18 9a6 6 0 00-6-6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-brand-600 text-white"
          : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400"
      }`}
    >
      {children}
    </button>
  );
}

function TopicSetup({ topic, onBack, onStart, starting, error }) {
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <BackIcon className="h-4 w-4" />
        Back to topics
      </button>

      <div className="card space-y-4">
        <div>
          <span className="inline-flex w-fit items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            {topic.category}
          </span>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{topic.description}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Difficulty</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => (
              <CategoryPill key={d.id} active={difficulty === d.id} onClick={() => setDifficulty(d.id)}>
                {d.label}
              </CategoryPill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Number of questions</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {QUESTION_COUNTS.map((c) => (
              <CategoryPill key={c} active={count === c} onClick={() => setCount(c)}>
                {c} questions
              </CategoryPill>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <Button loading={starting} onClick={() => onStart({ difficulty, count })}>
          Start quiz
        </Button>
      </div>
    </div>
  );
}

function QuizRunner({ topic, difficulty, questions, onBack, onSubmit, submitting, error }) {
  const [answers, setAnswers] = useState({});

  const selectOption = (questionId, optionIndex) => {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  };

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = () => {
    const payload = questions.map((q) => ({
      id: q.id,
      token: q.token,
      selected_index: answers[q.id] ?? null,
    }));
    onSubmit(payload);
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <BackIcon className="h-4 w-4" />
        Back to topics
      </button>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h3>
          <p className="mt-1 text-sm capitalize text-slate-600 dark:text-slate-400">
            {difficulty} &middot; {questions.length} questions
          </p>
        </div>
        <span className="inline-flex flex-none items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="card space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {index + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((option, optionIndex) => {
                const selected = answers[q.id] === optionIndex;
                return (
                  <label
                    key={optionIndex}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                      selected
                        ? "border-brand-400 bg-brand-50/60 dark:border-brand-600 dark:bg-brand-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-0.5 h-4 w-4 flex-none accent-brand-600"
                      checked={selected}
                      onChange={() => selectOption(q.id, optionIndex)}
                    />
                    <span className="text-slate-700 dark:text-slate-300">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      <Button loading={submitting} onClick={handleSubmit}>
        Submit quiz
      </Button>
    </div>
  );
}

function QuizResults({ topic, result, onBack, onRetake }) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <BackIcon className="h-4 w-4" />
        Back to topics
      </button>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{topic.title} &mdash; results</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {result.correct_count} of {result.total} correct
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(result.score)}%</p>
          <Button variant="secondary" className="mt-2" onClick={onRetake}>
            Try again
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {result.results.map((item, index) => (
          <div key={item.id} className="card space-y-3">
            <div className="flex items-start gap-2">
              {item.is_correct ? (
                <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircleIcon className="mt-0.5 h-5 w-5 flex-none text-red-600 dark:text-red-400" />
              )}
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {index + 1}. {item.question}
              </p>
            </div>

            <div className="space-y-1.5">
              {item.options.map((option, optionIndex) => {
                const isCorrectOption = optionIndex === item.correct_index;
                const isSelectedOption = optionIndex === item.selected_index;
                let tone = "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400";
                if (isCorrectOption) {
                  tone =
                    "border-emerald-300 bg-emerald-50/60 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400";
                } else if (isSelectedOption) {
                  tone = "border-red-300 bg-red-50/60 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400";
                }
                return (
                  <div key={optionIndex} className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>
                    {option}
                    {isSelectedOption && !isCorrectOption && <span className="ml-2 text-xs font-semibold">(your answer)</span>}
                    {isCorrectOption && <span className="ml-2 text-xs font-semibold">(correct answer)</span>}
                    {item.selected_index === null && isCorrectOption && (
                      <span className="ml-2 text-xs font-semibold">(you skipped this)</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
              <LightbulbIcon className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={onRetake}>
        Try again
      </Button>
    </div>
  );
}

function Assessments() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [stage, setStage] = useState("browse"); // "browse" | "setup" | "quiz" | "results"
  const [quiz, setQuiz] = useState(null);
  const [quizStarting, setQuizStarting] = useState(false);
  const [quizError, setQuizError] = useState("");

  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    listAptitudeCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => {
        /* category pills are a nice-to-have -- topics still load without them */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    listAptitudeTopics(activeCategory)
      .then(({ data }) => {
        if (!cancelled) setTopics(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load aptitude topics. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const openTopic = (topic) => {
    setSelectedTopic(topic);
    setQuiz(null);
    setResult(null);
    setQuizError("");
    setStage("setup");
  };

  const startQuiz = ({ difficulty, count }) => {
    setQuizStarting(true);
    setQuizError("");
    generateAptitudeQuiz(selectedTopic.id, { difficulty, count })
      .then(({ data }) => {
        setQuiz(data);
        setStage("quiz");
      })
      .catch((err) => setQuizError(err.response?.data?.detail || "Couldn't generate a quiz right now. Please try again."))
      .finally(() => setQuizStarting(false));
  };

  const submitQuiz = (answers) => {
    setSubmitting(true);
    setSubmitError("");
    submitAptitudeQuiz(answers)
      .then(({ data }) => {
        setResult(data);
        setStage("results");
      })
      .catch((err) => setSubmitError(err.response?.data?.detail || "Couldn't submit your quiz right now. Please try again."))
      .finally(() => setSubmitting(false));
  };

  const backToTopics = () => {
    setSelectedTopic(null);
    setQuiz(null);
    setResult(null);
    setStage("browse");
  };

  if (selectedTopic && stage === "setup") {
    return <TopicSetup topic={selectedTopic} onBack={backToTopics} onStart={startQuiz} starting={quizStarting} error={quizError} />;
  }

  if (selectedTopic && stage === "quiz" && quiz) {
    return (
      <QuizRunner
        topic={selectedTopic}
        difficulty={quiz.difficulty}
        questions={quiz.questions}
        onBack={backToTopics}
        onSubmit={submitQuiz}
        submitting={submitting}
        error={submitError}
      />
    );
  }

  if (selectedTopic && stage === "results" && result) {
    return (
      <QuizResults
        topic={selectedTopic}
        result={result}
        onBack={backToTopics}
        onRetake={() => {
          setResult(null);
          setQuiz(null);
          setStage("setup");
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Aptitude assessments</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Pick a topic and get an AI-generated multiple-choice quiz to practice with -- Quantitative Aptitude,
              Logical Reasoning, and Verbal Ability, the same format used by most placement tests. No coding
              questions here -- that's what Practice Interview is for.
            </p>
          </div>
          <span className="inline-flex flex-none items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Timed mock tests coming soon
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <CategoryPill active={activeCategory === null} onClick={() => setActiveCategory(null)}>
            All topics
          </CategoryPill>
          {categories.map((category) => (
            <CategoryPill key={category} active={activeCategory === category} onClick={() => setActiveCategory(category)}>
              {category}
            </CategoryPill>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="card py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading topics...</div>
      ) : topics.length === 0 ? (
        <div className="card py-10 text-center text-sm text-slate-500 dark:text-slate-400">No topics in this category yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <div key={topic.id} className="card flex flex-col gap-2">
              <span className="inline-flex w-fit items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                {topic.category}
              </span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{topic.description}</p>
              <Button className="mt-2 self-start" onClick={() => openTopic(topic)}>
                Take a quiz
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Assessments;
