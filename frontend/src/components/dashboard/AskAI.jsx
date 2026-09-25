import { useState } from "react";

import { generateAskAIQuestions } from "../../services/api.js";
import Button from "../common/Button.jsx";

const EXAMPLE_PROMPTS = [
  "5 medium Python OOP questions",
  "Hard system design questions for a backend role",
  "Quick behavioral questions about teamwork",
];

const DIFFICULTY_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };
const QUESTION_TYPE_LABELS = {
  conceptual: "Conceptual",
  coding: "Coding",
  scenario: "Scenario-based",
  behavioral: "Behavioral",
  mixed: "Mixed",
};

function InterpretedChips({ interpreted }) {
  const chips = [
    interpreted.role,
    interpreted.topic,
    DIFFICULTY_LABELS[interpreted.difficulty] || interpreted.difficulty,
    QUESTION_TYPE_LABELS[interpreted.question_type] || interpreted.question_type,
    `${interpreted.count} question${interpreted.count === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip, index) => (
        <span
          key={`${chip}-${index}`}
          className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function AskAI() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleGenerate = async (event) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Describe what you'd like to practice first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await generateAskAIQuestions(trimmed);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't generate practice questions. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ask AI for practice questions</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Describe what you want to practice in your own words -- topic, difficulty, how many questions -- and
        get a tailored set instantly. This doesn't start a full mock interview or collect feedback.
      </p>

      <form onSubmit={handleGenerate} className="mt-5">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          placeholder='e.g. "5 medium-difficulty Python OOP questions" or "hard system design questions"'
          className="input-field resize-none"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:border-brand-300 hover:text-brand-600"
            >
              {example}
            </button>
          ))}
        </div>

        {error && <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <Button type="submit" loading={loading} className="mt-4">
          {loading ? "Generating..." : "Generate questions"}
        </Button>
      </form>

      {result && (
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
          <p className="text-sm text-slate-600 dark:text-slate-400">{result.interpreted.summary}</p>
          <div className="mt-2">
            <InterpretedChips interpreted={result.interpreted} />
          </div>

          <ol className="mt-4 space-y-3">
            {result.questions.map((question, index) => (
              <li key={index} className="flex gap-3 rounded-xl bg-slate-50 dark:bg-slate-900 px-4 py-3">
                <span className="flex-none text-sm font-semibold text-brand-600 dark:text-brand-400">{index + 1}.</span>
                <span className="text-sm text-slate-800 dark:text-slate-200">{question}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default AskAI;
