import InterviewSetup from "../components/interview/InterviewSetup.jsx";

function StartInterview() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-900/40 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-100 dark:ring-brand-800/60">
          AI Mock Interview
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Configure your interview</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Choose the interview type, difficulty, role and duration, then review your setup before you begin.
        </p>
      </div>
      <InterviewSetup />
    </div>
  );
}

export default StartInterview;
