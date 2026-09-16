const FEATURES = [
  {
    title: "Tailored questions",
    description: "Generated from the role, job description, and your resume -- not generic templates.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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
    description: "A clear summary, concrete strengths, and specific things to improve -- not just a score.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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
    description: "Answer one question at a time, in your own words, whenever you have a few minutes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function Hero() {
  return (
    <div className="animate-fade-up">
      <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
        Practice makes prepared
      </span>
      <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
        Walk into your next interview{" "}
        <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
          already prepared
        </span>
      </h1>
      <p className="mt-5 max-w-lg text-lg text-slate-600">
        Tell MockMate the role you're targeting and it generates tailored
        interview questions, then gives you structured feedback on how you
        answered.
      </p>

      <ul className="mt-10 space-y-6">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex items-start gap-4">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
              {feature.icon}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{feature.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Hero;
