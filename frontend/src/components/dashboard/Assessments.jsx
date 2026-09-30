import { useEffect, useState } from "react";

import {
  generateAptitudeQuiz,
  generateCustomAptitudeFormulaSheet,
  generateCustomAptitudeQuiz,
  getAptitudeFormulaSheet,
  listAptitudeCategories,
  listAptitudeTopics,
  submitAptitudeQuiz,
} from "../../services/api.js";
import Button from "../common/Button.jsx";

const DIFFICULTIES = [
  { id: "easy", label: "Easy", description: "Warm-up questions, quick to solve", tone: "emerald" },
  { id: "medium", label: "Medium", description: "Standard exam-level difficulty", tone: "amber" },
  { id: "hard", label: "Hard", description: "Tricky, multi-step problems", tone: "red" },
];

const QUESTION_COUNT_OPTIONS = [
  { value: 5, label: "5 questions", description: "~5 minutes" },
  { value: 10, label: "10 questions", description: "~10 minutes" },
];

const MIN_QUESTION_COUNT = 3;
const MAX_QUESTION_COUNT = 20;

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

function CalculatorIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 7h8M8 11.2h.01M12 11.2h.01M16 11.2h.01M8 15h.01M12 15h.01M16 15h.01M8 18.8h.01M12 18.8h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReasoningIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="6" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="18" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.7 7.3L10.6 16M16.3 7.3L13.4 16M8.1 6h7.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 016.5 3H12v16.5H6.5A2.5 2.5 0 014 17V5.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path
        d="M20 5.5A2.5 2.5 0 0017.5 3H12v16.5h5.5A2.5 2.5 0 0020 17V5.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2-5.2-1.8 5.2-1.8L12 2.5z" />
    </svg>
  );
}

const CATEGORY_ICONS = {
  "Quantitative Aptitude": CalculatorIcon,
  "Logical Reasoning": ReasoningIcon,
  "Verbal Ability": BookIcon,
};

function CategoryIcon({ category, className }) {
  const IconComponent = CATEGORY_ICONS[category] || TargetIcon;
  return <IconComponent className={className} />;
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

const OPTION_CARD_TONES = {
  brand: "border-brand-400 bg-brand-50/60 ring-1 ring-brand-400 dark:border-brand-600 dark:bg-brand-900/20",
  emerald: "border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-400 dark:border-emerald-600 dark:bg-emerald-900/20",
  amber: "border-amber-400 bg-amber-50/60 ring-1 ring-amber-400 dark:border-amber-600 dark:bg-amber-900/20",
  red: "border-red-400 bg-red-50/60 ring-1 ring-red-400 dark:border-red-600 dark:bg-red-900/20",
};

const OPTION_CARD_CHECK_TONES = {
  brand: "text-brand-600 dark:text-brand-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
};

function OptionCard({ selected, title, description, tone = "brand", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? OPTION_CARD_TONES[tone]
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      {selected && <CheckCircleIcon className={`absolute right-2.5 top-2.5 h-4 w-4 ${OPTION_CARD_CHECK_TONES[tone]}`} />}
      <span className="pr-5 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
    </button>
  );
}

function TopicSetup({ topic, onBack, onStart, onViewFormulaSheet, starting, error }) {
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");

  const handlePresetClick = (value) => {
    setCustomMode(false);
    setCount(value);
  };

  const handleCustomChange = (event) => {
    const raw = event.target.value;
    setCustomMode(true);
    setCustomText(raw);
    const parsed = Number(raw);
    if (raw !== "" && Number.isInteger(parsed)) {
      setCount(Math.max(MIN_QUESTION_COUNT, Math.min(MAX_QUESTION_COUNT, parsed)));
    }
  };

  const handleCustomBlur = () => {
    // Self-heal: an empty or invalid custom value snaps back to whatever
    // the last valid count was, so the field never gets stuck unusable.
    setCustomText(String(count));
  };

  const customIsInvalid = customMode && (customText === "" || !Number.isInteger(Number(customText)));

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

      <div className="card space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <CategoryIcon category={topic.category} className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex w-fit items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                {topic.category}
              </span>
              <h3 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{topic.description}</p>
            </div>
          </div>
          <Button variant="success" className="flex-none" onClick={onViewFormulaSheet}>
            Formula sheet
          </Button>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Difficulty</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {DIFFICULTIES.map((d) => (
              <OptionCard
                key={d.id}
                selected={difficulty === d.id}
                title={d.label}
                description={d.description}
                tone={d.tone}
                onClick={() => setDifficulty(d.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Number of questions</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {QUESTION_COUNT_OPTIONS.map((c) => (
              <OptionCard
                key={c.value}
                selected={!customMode && count === c.value}
                title={c.label}
                description={c.description}
                onClick={() => handlePresetClick(c.value)}
              />
            ))}
            <label
              className={`relative flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition ${
                customMode && !customIsInvalid
                  ? OPTION_CARD_TONES.brand
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {customMode && !customIsInvalid && (
                <CheckCircleIcon className={`absolute right-2.5 top-2.5 h-4 w-4 ${OPTION_CARD_CHECK_TONES.brand}`} />
              )}
              <span className="pr-5 text-sm font-semibold text-slate-900 dark:text-slate-100">Custom</span>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_QUESTION_COUNT}
                max={MAX_QUESTION_COUNT}
                value={customMode ? customText : ""}
                onFocus={() => {
                  if (!customMode) {
                    setCustomMode(true);
                    setCustomText(String(count));
                  }
                }}
                onChange={handleCustomChange}
                onBlur={handleCustomBlur}
                placeholder={`${MIN_QUESTION_COUNT}-${MAX_QUESTION_COUNT}`}
                className="mt-0.5 w-full bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none dark:text-slate-400"
              />
            </label>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            Pick a preset or type any number of questions from {MIN_QUESTION_COUNT} to {MAX_QUESTION_COUNT}.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">{difficulty}</span> &middot; {count}{" "}
            questions on <span className="font-semibold text-slate-900 dark:text-slate-100">{topic.title}</span>
          </p>
          <Button loading={starting} disabled={customIsInvalid} onClick={() => onStart({ difficulty, count })}>
            Start quiz
          </Button>
        </div>
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

function FormulaSheet({ topic, sheet, loading, error, onBack, onTakeQuiz }) {
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
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CategoryIcon category={topic.category} className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Formula sheet
              </span>
              {sheet?.source === "ai_generated" ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <SparkleIcon className="h-3 w-3" />
                  AI-generated
                </span>
              ) : sheet ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <CheckCircleIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  Verified reference
                </span>
              ) : null}
            </div>
            <h3 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h3>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading formula sheet...</p>}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {sheet?.source === "ai_generated" && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            This topic isn't in our curated reference set, so Gemini generated this on the fly -- double-check any
            formula before relying on it.
          </p>
        )}

        {sheet && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Key formulas &amp; rules
              </p>
              <ul className="mt-2 space-y-2">
                {sheet.formulas.map((formula, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                    {formula}
                  </li>
                ))}
              </ul>
            </div>

            {sheet.example && (
              <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Worked example
                </p>
                <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">{sheet.example}</p>
              </div>
            )}

            <Button onClick={onTakeQuiz}>Take a quiz on this topic</Button>
          </>
        )}
      </div>
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

  const [formulaSheet, setFormulaSheet] = useState(null);
  const [formulaLoading, setFormulaLoading] = useState(false);
  const [formulaError, setFormulaError] = useState("");

  const [customQuery, setCustomQuery] = useState("");

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

  const openFormulaSheet = (topic) => {
    setSelectedTopic(topic);
    setFormulaSheet(null);
    setFormulaError("");
    setFormulaLoading(true);
    setStage("formula");
    const request = topic.isCustom
      ? generateCustomAptitudeFormulaSheet(topic.title)
      : getAptitudeFormulaSheet(topic.id);
    request
      .then(({ data }) => setFormulaSheet(data))
      .catch((err) => setFormulaError(err.response?.data?.detail || "Couldn't load a formula sheet for this topic."))
      .finally(() => setFormulaLoading(false));
  };

  const startQuiz = ({ difficulty, count }) => {
    setQuizStarting(true);
    setQuizError("");
    const request = selectedTopic.isCustom
      ? generateCustomAptitudeQuiz(selectedTopic.title, { difficulty, count })
      : generateAptitudeQuiz(selectedTopic.id, { difficulty, count });
    request
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
    setFormulaSheet(null);
    setFormulaError("");
    setStage("browse");
  };

  const handleCustomSearch = (event) => {
    event.preventDefault();
    const query = customQuery.trim();
    if (!query) return;
    openTopic({
      id: `custom-${Date.now()}`,
      category: "Custom topic",
      title: query,
      description: "A topic you searched for.",
      isCustom: true,
    });
  };

  if (selectedTopic && stage === "formula") {
    return (
      <FormulaSheet
        topic={selectedTopic}
        sheet={formulaSheet}
        loading={formulaLoading}
        error={formulaError}
        onBack={backToTopics}
        onTakeQuiz={() => setStage("setup")}
      />
    );
  }

  if (selectedTopic && stage === "setup") {
    return (
      <TopicSetup
        topic={selectedTopic}
        onBack={backToTopics}
        onStart={startQuiz}
        onViewFormulaSheet={() => openFormulaSheet(selectedTopic)}
        starting={quizStarting}
        error={quizError}
      />
    );
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

        <div className="mt-4 rounded-xl border border-brand-100 dark:border-brand-900/40 bg-brand-50/50 dark:bg-brand-950/20 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
            <SparkleIcon className="h-3.5 w-3.5" />
            Ask AI for a topic
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Not in the list below? Type any aptitude topic and get a quiz for it.
          </p>
          <form onSubmit={handleCustomSearch} className="mt-2 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customQuery}
                onChange={(event) => setCustomQuery(event.target.value)}
                maxLength={100}
                placeholder="e.g. Permutations and Combinations, Clocks and Calendars"
                className="input-field pl-9"
              />
            </div>
            <Button type="submit" disabled={!customQuery.trim()} className="sm:flex-none">
              Search
            </Button>
          </form>
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
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                <CategoryIcon category={topic.category} className="h-3.5 w-3.5" />
                {topic.category}
              </span>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{topic.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{topic.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button onClick={() => openTopic(topic)}>Take a quiz</Button>
                <Button variant="success" onClick={() => openFormulaSheet(topic)}>
                  Formula sheet
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Assessments;
