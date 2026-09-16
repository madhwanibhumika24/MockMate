import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/common/Button.jsx";
import { createInterviewSession, uploadResume } from "../services/api.js";

function Home() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleResumeChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setResumeText("");
    setError("");
    setParsingResume(true);
    try {
      const { data } = await uploadResume(file);
      setResumeText(data.resume_text);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't read that resume file.");
      setResumeFile(null);
    } finally {
      setParsingResume(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!role.trim()) {
      setError("Please enter the role you're practicing for.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { data } = await createInterviewSession({
        role: role.trim(),
        job_description: jobDescription.trim() || null,
        resume_text: resumeText || null,
        resume_filename: resumeFile?.name || null,
      });
      navigate(`/interview/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't start the interview. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Practice makes prepared
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          Ace your next interview
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-slate-600">
          Tell us the role you're targeting and we'll generate tailored interview
          questions, then give you structured feedback on your answers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card mt-10 space-y-6">
        <div>
          <label htmlFor="role" className="field-label">
            Role you're interviewing for
          </label>
          <input
            id="role"
            type="text"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="e.g. Backend Engineer"
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="jobDescription" className="field-label">
            Job description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={5}
            placeholder="Paste the job description here for more targeted questions"
            className="input-field resize-none"
          />
        </div>

        <div>
          <label htmlFor="resume" className="field-label">
            Resume <span className="font-normal text-slate-400">(optional &middot; PDF, DOCX, or TXT)</span>
          </label>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 transition hover:border-brand-400">
            <div className="text-center">
              <input
                id="resume"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleResumeChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
              />
              {parsingResume && (
                <p className="mt-2 text-sm text-slate-500">Reading resume...</p>
              )}
              {resumeText && !parsingResume && (
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  &#10003; {resumeFile?.name} &middot; {resumeText.length} characters extracted
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" loading={submitting} disabled={parsingResume} className="w-full">
          {submitting ? "Starting interview..." : "Start Interview"}
        </Button>
      </form>
    </div>
  );
}

export default Home;
