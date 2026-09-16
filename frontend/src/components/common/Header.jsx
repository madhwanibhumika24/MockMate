import { Link } from "react-router-dom";

import Logo from "./Logo.jsx";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-5">
          <a
            href="/#how-it-works"
            className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:block"
          >
            How it works
          </a>
          <a
            href="/#start-form"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-500"
          >
            Practice now
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
