import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createInterviewSession, uploadResume } from "../../services/api.js";
import { COURSES, OTHER_VALUE } from "../../utils/roleOptions.js";
import Button from "../common/Button.jsx";

function StartInterviewForm() {
  const navigate = useNavigate();

  const [courseValue, setCourseValue] = useState("");
  const [roleValue, setRoleValue] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [jobDescription, setJobDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const selectedCourse = useMemo(
    () => COURSES.find((course) => course.value === courseValue),
    [courseValue],
  );

  // Free-text entry is needed whenever the course itself isn't listed, or a
  // listed course's role dropdown was set to "Other".
  const needsCustomRole = courseValue === OTHER_VALUE || roleValue === OTHER_VALUE;

  // The actual value that gets submitted as the session's role.
  const resolvedRole = needsCustomRole ? customRole.trim() : roleValue;

  const handleCourseChange = (event) => {
    setCourseValue(event.target.value);
    setRoleValue("");
    setCustomRole("");
  };

  const handleFile = async (file) => {
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

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!courseValue) {
      setError("Please choose a course/field.");
      return;
    }
    if (!resolvedRole) {
      setError("Please choose a role, or type one in.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { data } = await createInterviewSession({
        role: resolvedRole,
        job_description: jobDescription.trim() || null,
        resume_text: resumeText || null,
        resume_filename: resumeFile?.name || null,
        difficulty,
      });
      navigate(`/interview/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't start the interview. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form
      id="start-form"
      onSubmit={handleSubmit}
      className="card animate-fade-up-delay-1"
    >
      <h2 className="text-lg font-bold text-slate-900">Start a mock interview</h2>
      <p className="mt-1 text-sm text-slate-500">Takes about a minute to set up.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="course" className="field-label">
            Course / field
          </label>
          <select
            id="course"
            value={courseValue}
            onChange={handleCourseChange}
            className="input-field"
            required
          >
            <option value="" disabled>
              Select a course/field...
            </option>
            {COURSES.map((course) => (
              <option key={course.value} value={course.value}>
                {course.label}
              </option>
            ))}
            <option value={OTHER_VALUE}>Other / not listed</option>
          </select>
        </div>

        {courseValue && courseValue !== OTHER_VALUE && (
          <div>
            <label htmlFor="role" className="field-label">
              Role
            </label>
            <select
              id="role"
              value={roleValue}
              onChange={(event) => setRoleValue(event.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>
                Select a role...
              </option>
              {selectedCourse?.roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
              <option value={OTHER_VALUE}>Other / not listed</option>
            </select>
          </div>
        )}

        {needsCustomRole && (
          <div>
            <label htmlFor="customRole" className="field-label">
              Type the role
            </label>
            <input
              id="customRole"
              type="text"
              value={customRole}
              onChange={(event) => setCustomRole(event.target.value)}
              placeholder="e.g. Site Reliability Engineer"
              className="input-field"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="jobDescription" className="field-label">
            Job description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={4}
            placeholder="Paste the job description here for more targeted questions"
            className="input-field resize-none"
          />
        </div>

        <div>
          <label htmlFor="difficulty" className="field-label">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="input-field"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label htmlFor="resume" className="field-label">
            Resume <span className="font-normal text-slate-400">(optional &middot; PDF, DOCX, or TXT)</span>
          </label>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
              dragActive
                ? "border-brand-500 bg-brand-50"
                : "border-slate-300 hover:border-brand-400 hover:bg-slate-50"
            }`}
          >
            <input
              id="resume"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => handleFile(event.target.files?.[0])}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <svg className="mx-auto h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 15V4m0 0L8 8m4-4l4 4M5 17v1a2 2 0 002 2h10a2 2 0 002-2v-1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
            </p>
            {parsingResume && <p className="mt-1 text-xs text-slate-500">Reading resume...</p>}
            {resumeText && !parsingResume && (
              <p className="mt-1 text-xs font-medium text-emerald-600">
                &#10003; {resumeFile?.name} &middot; {resumeText.length} characters extracted
              </p>
            )}
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Button type="submit" loading={submitting} disabled={parsingResume} className="w-full group">
          {submitting ? (
            "Starting interview..."
          ) : (
            <>
              Start Interview
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14m0 0l-6-6m6 6l-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default StartInterviewForm;
