import { INTERVIEW_TYPES, SETUP_DIFFICULTIES } from "../../utils/roleOptions.js";

// Phase 2 -- Feature 4: the interview room's header. Sticky so it (and the
// progress bar) stay visible while the conversation below scrolls -- part
// of what makes this feel like its own dedicated room rather than another
// dashboard page. Has room for the live timer (Feature 5) to slot in next
// to the question counter once that's built.
function InterviewRoomHeader({ role, interviewType, difficulty, questionNumber, totalQuestions }) {
  const typeLabel = INTERVIEW_TYPES.find((option) => option.value === interviewType)?.label || interviewType;
  const difficultyLabel = SETUP_DIFFICULTIES.find((option) => option.value === difficulty)?.label || difficulty;
  const progress = totalQuestions > 0 ? (Math.min(questionNumber - 1, totalQuestions) / totalQuestions) * 100 : 0;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
            {role}
          </span>
          <span className="hidden text-xs font-medium text-slate-400 sm:inline">
            {typeLabel} &middot; {difficultyLabel}
          </span>
        </div>
        <span className="text-sm font-medium text-slate-500">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden bg-slate-100">
        <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}

export default InterviewRoomHeader;
