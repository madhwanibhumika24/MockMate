import { useRef, useState } from "react";

import { deleteMyResume, updateMyResume, uploadResume } from "../../services/api.js";

function AnalysisChips({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <span
            key={`${label}-${index}`}
            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResumeAnalysisSummary({ analysis }) {
  if (!analysis) return null;
  const projectNames = (analysis.projects || []).map((p) => p.name).filter(Boolean);
  const experienceRoles = (analysis.experience || [])
    .map((e) => (e.organization ? `${e.role} @ ${e.organization}` : e.role))
    .filter(Boolean);

  const hasAnything =
    (analysis.skills || []).length ||
    (analysis.education || []).length ||
    projectNames.length ||
    experienceRoles.length ||
    (analysis.certifications || []).length;

  if (!hasAnything) return null;

  return (
    <details className="mt-3 border-t border-slate-100 pt-3">
      <summary className="cursor-pointer list-none text-sm font-semibold text-brand-600 marker:content-none hover:text-brand-700">
        View what we found in your resume
      </summary>
      <div className="mt-3">
        <AnalysisChips label="Skills" items={analysis.skills} />
        <AnalysisChips label="Education" items={analysis.education} />
        <AnalysisChips label="Projects" items={projectNames} />
        <AnalysisChips label="Experience" items={experienceRoles} />
        <AnalysisChips label="Certifications" items={analysis.certifications} />
        <p className="mt-2 text-xs text-slate-400">
          This is used to keep resume-based interview questions grounded in what's actually on your resume.
        </p>
      </div>
    </details>
  );
}

// The one common place to manage a resume -- uploaded here once, it's reused
// automatically every time an interview is started (Start Interview still
// lets you override it for a single session if you want a different one).
function ResumeManager({ profile, onProfileUpdate }) {
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
    <div className="card mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">Resume</h3>
          <p className="mt-1 text-sm text-slate-600">
            Upload once and it's used to personalize every mock interview -- no need to attach it again each time.
          </p>
          {profile?.resume_filename && (
            <p className="mt-2 text-sm font-medium text-emerald-600">&#10003; {profile.resume_filename}</p>
          )}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex flex-none gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? "Uploading..." : profile?.resume_filename ? "Replace" : "Upload resume"}
          </button>
          {profile?.resume_filename && (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <ResumeAnalysisSummary analysis={profile?.resume_analysis} />
    </div>
  );
}

export default ResumeManager;
