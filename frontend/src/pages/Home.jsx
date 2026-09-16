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
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold">MockMate</h1>
        <p className="mt-2 text-gray-600">
          Upload your resume or a job description and practice with AI-generated
          interview questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role you're interviewing for
          </label>
          <input
            id="role"
            type="text"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="e.g. Backend Engineer"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">
            Job description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={5}
            placeholder="Paste the job description here for more targeted questions"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
            Resume <span className="text-gray-400">(optional, PDF/DOCX/TXT)</span>
          </label>
          <input
            id="resume"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleResumeChange}
            className="mt-1 w-full text-sm text-gray-600"
          />
          {parsingResume && <p className="mt-1 text-sm text-gray-500">Reading resume...</p>}
          {resumeText && !parsingResume && (
            <p className="mt-1 text-sm text-green-600">
              Resume loaded ({resumeFile?.name}) -- {resumeText.length} characters extracted.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting || parsingResume} className="w-full">
          {submitting ? "Starting..." : "Start Interview"}
        </Button>
      </form>
    </div>
  );
}

export default Home;
