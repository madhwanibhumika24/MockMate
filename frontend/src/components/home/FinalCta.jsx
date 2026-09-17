import { Link } from "react-router-dom";

function FinalCta() {
  return (
    <div className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to walk in prepared?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Set up your first mock interview in under a minute -- pick a role, add context if you like, and start
          practicing.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:-translate-y-0.5 hover:bg-brand-400"
        >
          Start a mock interview
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M5 12h14m0 0l-6-6m6 6l-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default FinalCta;
