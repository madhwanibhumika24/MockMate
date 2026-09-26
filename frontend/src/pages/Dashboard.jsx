import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ProfileMenu from "../components/dashboard/ProfileMenu.jsx";
import InterviewHistory from "../components/dashboard/InterviewHistory.jsx";
import ResumeManager from "../components/dashboard/ResumeManager.jsx";
import StatsSummary from "../components/dashboard/StatsSummary.jsx";
import ProgressChart from "../components/dashboard/ProgressChart.jsx";
import ReadinessInsights from "../components/dashboard/ReadinessInsights.jsx";
import AskAI from "../components/dashboard/AskAI.jsx";
import GroupDiscussion from "../components/dashboard/GroupDiscussion.jsx";
import Logo from "../components/common/Logo.jsx";
import ThemeToggle from "../components/common/ThemeToggle.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import { getMyProfile, listInterviewSessions } from "../services/api.js";
import { useAuth } from "../store/AuthContext.jsx";

const TABS = [
  { id: "interview", label: "Practice Interview" },
  { id: "ask-ai", label: "Ask AI" },
  { id: "group-discussion", label: "Group Discussion" },
  { id: "assessments", label: "Assessments" },
];

function InterviewTab({ sessions, sessionsLoading }) {
  return (
    <div>
      <div className="card flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Start a new mock interview</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pick a role, get AI-generated questions, and receive structured feedback afterward.
          </p>
        </div>
        <Link
          to="/start"
          className="inline-flex flex-none items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
        >
          Start Interview
        </Link>
      </div>

      <InterviewHistory sessions={sessions} loading={sessionsLoading} />
    </div>
  );
}

function AssessmentsTab() {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        Coming soon
      </span>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Skill assessments</h3>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
        Timed, role-specific assessments to benchmark your skills are on the way.
      </p>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listInterviewSessions()
      .then(({ data }) => {
        if (!cancelled) setSessions(data);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    setLoggingOut(true);

    // Keep the "Logging out..." screen up for at least 5 seconds, even
    // though the actual logout call is usually much faster -- runs the
    // real logout and the timer side by side rather than one after the
    // other, so it never takes longer than necessary either.
    const minDisplayTime = new Promise((resolve) => window.setTimeout(resolve, 5000));
    await Promise.all([logout(), minDisplayTime]);

    navigate("/");
  };

  const firstName = user.full_name?.split(" ")[0] || user.email;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/dashboard">
            <Logo dark={false} />
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ProfileMenu
              user={user}
              profile={profile}
              sessions={sessions}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="relative overflow-hidden rounded-lg border border-red-300/50 bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 shadow-sm shadow-red-900/5 backdrop-blur-md transition hover:bg-red-400/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/50 to-transparent" />
              <span className="relative z-10">{loggingOut ? "Logging out..." : "Log out"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Welcome back, {firstName}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Ready to sharpen your interview skills?</p>

        <ReadinessInsights sessions={sessions} />

        <StatsSummary sessions={sessions} />

        <ProgressChart sessions={sessions} />

        <ResumeManager profile={profile} onProfileUpdate={setProfile} />

        <div className="mt-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav className="flex w-full gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-900">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === "interview" && (
            <InterviewTab sessions={sessions} sessionsLoading={sessionsLoading} />
          )}
          {activeTab === "ask-ai" && <AskAI />}
          {activeTab === "group-discussion" && <GroupDiscussion />}
          {activeTab === "assessments" && <AssessmentsTab />}
        </div>
      </main>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {loggingOut && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-red-100 dark:border-red-800/60 border-t-red-500" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Logging out...</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
