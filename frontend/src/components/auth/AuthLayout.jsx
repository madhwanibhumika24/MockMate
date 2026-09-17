import { Link } from "react-router-dom";

import Logo from "../common/Logo.jsx";

const FEATURES = [
  "Questions tailored to your role",
  "Structured feedback after every session",
  "Practice as many times as you like",
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-brand-300" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.27a7.2 7.2 0 010-4.54v-3.1H1.26a12 12 0 000 10.75l3.99-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.63l3.99 3.1c.95-2.83 3.61-4.96 6.75-4.96z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.11.82-.27.82-.6 0-.29-.01-1.06-.02-2.08-3.34.75-4.04-1.66-4.04-1.66-.55-1.44-1.34-1.82-1.34-1.82-1.09-.77.08-.75.08-.75 1.21.09 1.84 1.28 1.84 1.28 1.07 1.87 2.81 1.33 3.5 1.02.11-.79.42-1.33.76-1.64-2.67-.31-5.47-1.38-5.47-6.14 0-1.36.47-2.46 1.24-3.33-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.27a11.2 11.2 0 016 0c2.29-1.6 3.3-1.27 3.3-1.27.66 1.71.24 2.97.12 3.28.77.87 1.24 1.97 1.24 3.33 0 4.77-2.81 5.82-5.49 6.13.43.38.81 1.14.81 2.3 0 1.66-.02 3-.02 3.41 0 .33.22.72.83.6C20.57 22.34 24 17.74 24 12.3 24 5.5 18.63 0 12 0z"
      />
    </svg>
  );
}

/**
 * Shared two-panel layout for the auth pages (login / signup / reset password).
 * Left panel carries the brand story, right panel hosts the actual page content.
 *
 * `onOAuth` is called with "google" | "github" when an OAuth button is clicked.
 * There's no real OAuth provider wired up on the backend yet, so callers currently
 * just treat it the same as a successful mock login -- swap in the real flow here
 * once the backend supports it.
 */
function AuthLayout({ eyebrow, title, description, showOAuth = true, onOAuth, footer, children }) {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-100 px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 p-10 text-white lg:flex">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-brand-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />

          <Link to="/" className="relative">
            <Logo />
          </Link>

          <div className="relative">
            <h2 className="text-3xl font-extrabold leading-tight">
              Practice like it&rsquo;s
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-brand-100 bg-clip-text text-transparent">
                the real thing
              </span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{description}</p>

            <ul className="mt-7 space-y-4">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-400/20">
                    <CheckIcon />
                  </span>
                  <span className="text-sm text-slate-200">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <blockquote className="relative border-l-2 border-brand-400 pl-4">
            <p className="text-sm italic leading-relaxed text-slate-200">
              &ldquo;Success is where preparation and opportunity meet.&rdquo;
            </p>
            <p className="mt-1 text-xs text-slate-400">&mdash; Bobby Unser</p>
          </blockquote>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-7 text-center lg:text-left">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                {eyebrow}
              </span>
              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            </div>

            {showOAuth && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onOAuth?.("google")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <GoogleIcon />
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => onOAuth?.("github")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <GithubIcon />
                    GitHub
                  </button>
                </div>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    or continue with email
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              </>
            )}

            {children}

            {footer && <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
