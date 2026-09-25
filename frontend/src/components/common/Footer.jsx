import { Link } from "react-router-dom";

import Logo from "./Logo.jsx";

const FOOTER_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#support", label: "Support" },
];

function Footer() {
  return (
    <footer className="border-t border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div className="text-center sm:text-left">
            <Link to="/">
              <Logo dark={false} />
            </Link>
            <p className="mt-2 max-w-xs text-sm text-slate-600 dark:text-slate-400">
              Practice interviews with AI-generated questions and structured feedback.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:text-brand-600"
              >
                {link.label}
              </a>
            ))}
            <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:text-brand-600">
              Log in
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} MockMate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
