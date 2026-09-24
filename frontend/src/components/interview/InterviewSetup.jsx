import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createInterviewSession } from "../../services/api.js";
import { INTERVIEW_TYPES, SETUP_DIFFICULTIES, SETUP_DURATIONS, SETUP_ROLES } from "../../utils/roleOptions.js";
import Button from "../common/Button.jsx";

function OptionPills({ options, value, onChange, columns = 3 }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Phase 2 -- Feature 1: Interview Setup. Configures a new AI mock interview
// (type, difficulty, role, duration), shows a summary, and starts it.
//
// Duration isn't enforced by the backend yet (which still asks a fixed
// number of questions per session, see MAX_QUESTIONS_PER_SESSION) -- it's
// carried through to the interview page via router state for the timer
// feature to pick up once it's built, so choosing it here isn't a dead end.
//
// Note: this replaces the previous Start Interview form, which also let you
// upload a resume, paste a job description, or focus on a specific
// language. Those aren't part of this new setup screen -- resumes are still
// managed from the dashboard's Resume card (and still ground the Resume
// Analyzer), just not selectable per-session here anymore.
function InterviewSetup() {
  const navigate = useNavigate();

  const [interviewType, setInterviewType] = useState(INTERVIEW_TYPES[0].value);
  const [difficulty, setDifficulty] = useState(SETUP_DIFFICULTIES[0].value);
  const [role, setRole] = useState(SETUP_ROLES[0]);
  const [duration, setDuration] = useState(SETUP_DURATIONS[1]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const typeLabel = useMemo(
    () => INTERVIEW_TYPES.find((option) => option.value === interviewType)?.label || interviewType,
    [interviewType],
  );
  const difficultyLabel = useMemo(
    () => SETUP_DIFFICULTIES.find((option) => option.value === difficulty)?.label || difficulty,
    [difficulty],
  );

  const handleStart = async () => {
    setError("");
    setSubmitting(true);
    try {
      const { data } = await createInterviewSession({
        role,
        interview_type: interviewType,
        difficulty,
      });
      navigate(`/interview/${data.id}`, { state: { durationMinutes: duration } });
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't start the interview. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="space-y-6">
        <div>
          <p className="field-label mb-2">Interview type</p>
          <OptionPills
            options={INTERVIEW_TYPES}
            value={interviewType}
            onChange={setInterviewType}
            columns={2}
          />
        </div>

        <div>
          <p className="field-label mb-2">Difficulty</p>
          <OptionPills options={SETUP_DIFFICULTIES} value={difficulty} onChange={setDifficulty} columns={3} />
        </div>

        <div>
          <label htmlFor="setup-role" className="field-label">
            Role
          </label>
          <select
            id="setup-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="input-field"
          >
            {SETUP_ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="field-label mb-2">Duration</p>
          <OptionPills
            options={SETUP_DURATIONS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
            value={duration}
            onChange={setDuration}
            columns={4}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configuration summary</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <dt className="text-xs text-slate-500">Interview Type</dt>
              <dd className="text-sm font-semibold text-slate-900">{typeLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Role</dt>
              <dd className="text-sm font-semibold text-slate-900">{role}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Difficulty</dt>
              <dd className="text-sm font-semibold text-slate-900">{difficultyLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Duration</dt>
              <dd className="text-sm font-semibold text-slate-900">{duration} Minutes</dd>
            </div>
          </dl>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Button type="button" loading={submitting} onClick={handleStart} className="w-full">
          {submitting ? "Starting interview..." : "Start Interview"}
        </Button>
      </div>
    </div>
  );
}

export default InterviewSetup;
