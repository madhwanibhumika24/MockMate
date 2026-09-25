const FEATURE_CARDS = [
  {
    title: "Role-tailored questions",
    tagline: "No two interviews are the same -- yours shouldn't be either.",
    description:
      "Questions are generated from the exact role, job description, and resume you provide, mixing behavioral and technical angles.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M12 3v3m0 12v3M4.2 4.2l2.1 2.1m11.4 11.4l2.1 2.1M3 12h3m12 0h3M4.2 19.8l2.1-2.1m11.4-11.4l2.1-2.1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    title: "Structured feedback",
    tagline: "Know exactly what to work on -- not just how you scored.",
    description:
      "A clear summary, concrete strengths tied to your actual answers, and specific, actionable improvements.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M9 12.5l2 2 4.5-5M12 3l7.5 4.5v6L12 21l-7.5-7.5v-6L12 3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Practice at your pace",
    tagline: "A few minutes a day beats one long cram session.",
    description: "Answer one question at a time, in your own words, whenever you have a spare moment.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Resume-aware",
    tagline: "Talk about your own experience, not a generic script.",
    description: "Upload a PDF, DOCX, or TXT resume and questions draw directly on your actual background.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M7 3.5h7l3.5 3.5V20a1 1 0 01-1 1H7a1 1 0 01-1-1V4.5a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M9 12h6M9 15.5h6M9 8.5h2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Job-description matching",
    tagline: "Prepare for the job you're actually applying to.",
    description: "Paste a job description and the interview leans into the skills and priorities it calls out.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 3.5v-3.5h-.5A1.5 1.5 0 013 14.5v-9z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Track your progress",
    tagline: "Preparation compounds -- every session moves the needle.",
    description: "Every session and its feedback is saved, so you can look back on how your answers have improved.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 19V5m0 14h16M8 15l3-3 3 2 4-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function Features() {
  return (
    <div id="features" className="scroll-mt-20 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Features</span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Everything you need to walk in ready</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Every feature exists for one reason: to help you feel prepared, not just quizzed.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((feature) => (
            <div
              key={feature.title}
              className="card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
                {feature.icon}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
              <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">{feature.tagline}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Features;
