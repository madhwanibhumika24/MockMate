import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createInterviewSession, getMyProfile, uploadResume } from "../../services/api.js";
import { COURSES, INTERVIEW_TYPES, OTHER_VALUE, TOPICS } from "../../utils/roleOptions.js";
import Button from "../common/Button.jsx";

const TABS = [
  { id: "role", label: "By Role" },
  { id: "resume", label: "By Resume" },
  { id: "language", label: "By Language" },
];

function StartInterviewForm() {
  const navigate = useNavigate();

  const [courseValue, setCourseValue] = useState("");
  const [roleValue, setRoleValue] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [jobDescription, setJobDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [interviewType, setInterviewType] = useState("technical");
  const [topicValue, setTopicValue] = useState("");
  const [customTopic, setCustomTopic] = useState("");

  const [activeTab, setActiveTab] = useState("role");

  // The resume saved on the user's profile (if any) -- fetched once so the
  // "By Resume" tab can default to it instead of asking for a re-upload
  // every time.
  const [profileResume, setProfileResume] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  // true once the user chooses to upload a different resume for just this
  // session, instead of using the one saved on their profile.
  const [useOverrideResume, setUseOverrideResume] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then(({ data }) => {
        if (cancelled) return;
        if (data.resume_text) {
          setProfileResume(data);
        } else {
          // Nothing saved to default to -- go straight to the uploader.
          setUseOverrideResume(true);
        }
      })
      .catch(() => {
        if (!cancelled) setUseOverrideResume(true);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCourse = useMemo(
    () => COURSES.find((course) => course.value === courseValue),
    [courseValue],
  );

  // Free-text entry is needed whenever the course itself isn't listed, or a
  // listed course's role dropdown was set to "Other".
  const needsCustomRole = courseValue === OTHER_VALUE || roleValue === OTHER_VALUE;

  // The actual value that gets submitted as the session's role.
  const resolvedRole = needsCustomRole ? customRole.trim() : roleValue;

  const needsCustomTopic = topicValue === OTHER_VALUE;
  // Blank means "let AI decide" -- sent as null, same as never picking one.
  const resolvedTopic = needsCustomTopic ? customTopic.trim() : topicValue;

  // The resume actually used for this session: either a fresh upload (this
  // session only) or whatever's saved on the profile.
  const effectiveResumeText = useOverrideResume ? resumeText : profileResume?.resume_text || "";
  const effectiveResumeFilename = useOverrideResume
    ? resumeFile?.name || ""
    : profileResume?.resume_filename || "";

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
    if (activeTab === "resume" && !effectiveResumeText) {
      setError("Please add a resume to use this mode -- upload one below, or add one to your profile.");
      return;
    }
    if (activeTab === "language" && !resolvedTopic) {
      setError("Please choose a language/technology to focus this interview on.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { data } = await createInterviewSession({
        role: resolvedRole,
        job_description: jobDescription.trim() || null,
        resume_text: effectiveResumeText || null,
        resume_filename: effectiveResumeFilename || null,
        difficulty,
        topic: resolvedTopic || null,
        interview_type: interviewType,
      });
      navigate(`/interview/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't start the interview. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form id="start-form" onSubmit={handleSubmit} className="card animate-fade-up-delay-1">
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="interviewType" className="field-label">
              Interview type
            </label>
            <select
              id="interviewType"
              value={interviewType}
              onChange={(event) => setInterviewType(event.target.value)}
              className="input-field"
            >
              {INTERVIEW_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
        </div>

        <div>
          <p className="field-label mb-2">Personalize this interview</p>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === "role" && (
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
                <p className="mt-1.5 text-xs text-slate-500">
                  Want to focus on your resume or a specific language instead? Switch tabs above.
                </p>
              </div>
            )}

            {activeTab === "resume" && (
              <div>
                <label className="field-label">Resume</label>

                {profileLoading ? (
                  <p className="text-sm text-slate-500">Checking your saved resume...</p>
                ) : !useOverrideResume && profileResume?.resume_text ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-emerald-700">
                      &#10003; Using your saved resume &middot; {profileResume.resume_filename || "resume on file"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setUseOverrideResume(true)}
                      className="text-left text-sm font-semibold text-brand-600 hover:text-brand-700 sm:text-right"
                    >
                      Use a different resume for this interview
                    </button>
                  </div>
                ) : (
                  <>
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
                    {profileResume?.resume_text && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseOverrideResume(false);
                          setResumeFile(null);
                          setResumeText("");
                        }}
                        className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        &larr; Use my saved resume instead
                      </button>
                    )}
                    {!profileResume?.resume_text && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        No resume saved yet -- upload one here, or save one from your profile menu on the
                        dashboard to reuse it every time.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "language" && (
              <div>
                <label htmlFor="topic" className="field-label">
                  Language / technology
                </label>
                <select
                  id="topic"
                  value={topicValue}
                  onChange={(event) => {
                    setTopicValue(event.target.value);
                    setCustomTopic("");
                  }}
                  className="input-field"
                >
                  <option value="">Choose a language/technology...</option>
                  {TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                  <option value={OTHER_VALUE}>Other / not listed</option>
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  Fundamentals, OOP, and problem-solving questions will focus specifically on this.
                </p>

                {needsCustomTopic && (
                  <div className="mt-3">
                    <label htmlFor="customTopic" className="field-label">
                      Type the language/technology
                    </label>
                    <input
                      id="customTopic"
                      type="text"
                      value={customTopic}
                      onChange={(event) => setCustomTopic(event.target.value)}
                      placeholder="e.g. Rust"
                      className="input-field"
                    />
                  </div>
                )}
              </div>
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
