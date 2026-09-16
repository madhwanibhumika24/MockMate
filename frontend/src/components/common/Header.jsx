import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">MockMate</span>
        </Link>
        <span className="hidden text-sm text-slate-500 sm:block">AI-powered mock interviews</span>
      </div>
    </header>
  );
}

export default Header;
