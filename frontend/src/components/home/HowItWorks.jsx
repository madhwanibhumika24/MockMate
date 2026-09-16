const STEPS = [
  {
    step: "1",
    title: "Tell us the role",
    description: "Pick a course and role (or type your own), and optionally add a job description and resume.",
  },
  {
    step: "2",
    title: "Answer 5 questions",
    description: "Questions are generated one at a time, tailored to your role and adapted as you answer.",
  },
  {
    step: "3",
    title: "Get structured feedback",
    description: "A summary, concrete strengths, and specific things to improve -- based on your actual answers.",
  },
];

function HowItWorks() {
  return (
    <div id="how-it-works" className="relative scroll-mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {STEPS.map((item, index) => (
            <div key={item.step} className="relative text-center">
              {index < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-6 hidden h-px w-full bg-slate-200 sm:block" />
              )}
              <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                {item.step}
              </div>
              <p className="mt-4 font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1.5 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
