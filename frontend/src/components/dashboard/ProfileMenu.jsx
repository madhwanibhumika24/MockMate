import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { deleteMyResume, updateMyResume, uploadResume } from "../../services/api.js";

const EMPLOYMENT_LABELS = {
  fresher: "Fresher",
  experienced: "Experienced",
};

function ResumeSection({ profile, onProfileUpdate }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setBusy(true);
    setError("");
    try {
      const { data: parsed } = await uploadResume(file);
      const { data: updatedProfile } = await updateMyResume({
        resume_text: parsed.resume_text,
        resume_filename: file.name,
      });
      onProfileUpdate(updatedProfile);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't upload that resume. Try a different file.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError("");
    try {
      const { data: updatedProfile } = await deleteMyResume();
      onProfileUpdate(updatedProfile);
    } catch {
      setError("Couldn't remove the resume. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-slate-100 py-3 text-sm">
      <p className="mb-1.5 font-medium text-slate-700">Resume</p>

      {profile?.resume_filename ? (
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-slate-500">{profile.resume_filename}</span>
          <div className="flex flex-none gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              Replace
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          {busy ? "Uploading..." : "Upload resume"}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function ProfileMenu({ user, profile, onLogout, onProfileUpdate }) {
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 ring-2 ring-transparent transition hover:ring-brand-200"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{user.full_name || "MockMate user"}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="py-3 text-sm">
            {profile?.employment_status ? (
              <>
                <p className="font-medium text-slate-700">
                  {EMPLOYMENT_LABELS[profile.employment_status] || profile.employment_status}
                </p>
                {roleLine && <p className="mt-0.5 text-slate-500">{roleLine}</p>}
                {profile.target_role && (
                  <p className="mt-1 text-xs text-slate-400">Practicing for: {profile.target_role}</p>
                )}
              </>
            ) : (
              <p className="text-slate-500">
                No profile info yet.{" "}
                <Link to="/onboarding" className="font-semibold text-brand-600 hover:text-brand-700">
                  Add it
                </Link>
              </p>
            )}
          </div>

          <ResumeSection profile={profile} onProfileUpdate={onProfileUpdate} />

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
