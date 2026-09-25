import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { computeInterviewStats } from "../../utils/interviewStats.js";

const EMPLOYMENT_LABELS = {
  fresher: "Fresher",
  experienced: "Experienced",
};

const AUTH_PROVIDER_LABELS = {
  local: "Email & password",
  google: "Google",
  github: "GitHub",
};

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ProfileMenu({ user, profile, sessions = [], onLogout, loggingOut = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const initial = (user.full_name || user.email || "?").trim().charAt(0).toUpperCase();

  const roleLine =
    profile?.employment_status === "experienced"
      ? [profile.current_role, profile.company].filter(Boolean).join(" at ")
      : profile?.employment_status === "fresher"
        ? [profile.field_of_study, profile.education_level].filter(Boolean).join(", ")
        : null;

  const detailLine =
    profile?.employment_status === "experienced" && profile.years_experience != null
      ? `${profile.years_experience} year${profile.years_experience === 1 ? "" : "s"} of experience`
      : profile?.employment_status === "fresher" && profile.graduation_year
        ? `Graduating ${profile.graduation_year}`
        : null;

  const { completedCount, averageScore } = computeInterviewStats(sessions);
  const memberSince = formatDate(user.created_at);
  const signInMethod = AUTH_PROVIDER_LABELS[user.auth_provider] || user.auth_provider;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-800/50 text-sm font-bold text-brand-700 dark:text-brand-300 ring-2 ring-transparent transition hover:ring-brand-200"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-100 dark:bg-brand-800/50 text-base font-bold text-brand-700 dark:text-brand-300">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{user.full_name || "MockMate user"}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-800 py-3 text-sm">
            {profile?.employment_status ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {EMPLOYMENT_LABELS[profile.employment_status] || profile.employment_status}
                  </p>
                  <Link to="/onboarding" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700">
                    Edit profile
                  </Link>
                </div>
                {roleLine && <p className="mt-0.5 text-slate-500 dark:text-slate-400">{roleLine}</p>}
                {detailLine && <p className="mt-0.5 text-slate-500 dark:text-slate-400">{detailLine}</p>}
                {profile.target_role && (
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Practicing for: {profile.target_role}</p>
                )}
              </>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                No profile info yet.{" "}
                <Link to="/onboarding" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700">
                  Add it
                </Link>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 dark:border-slate-800 py-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Interviews</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">{completedCount} completed</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Avg. score</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                {averageScore !== null ? `${averageScore}/100` : "—"}
              </p>
            </div>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-800 py-3 text-sm text-slate-500 dark:text-slate-400">
            {memberSince && <p>Member since {memberSince}</p>}
            <p className="mt-0.5">Signs in with {signInMethod}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="relative mt-3 w-full overflow-hidden rounded-lg border border-red-300/50 bg-red-400/15 px-3 py-2 text-left text-sm font-medium text-red-600 dark:text-red-400 shadow-sm shadow-red-900/5 backdrop-blur-md transition hover:bg-red-400/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/50 to-transparent" />
            <span className="relative z-10">{loggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
