import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/common/Button.jsx";
import Logo from "../components/common/Logo.jsx";
import { skipOnboarding, updateMyProfile } from "../services/api.js";
import { useAuth } from "../store/AuthContext.jsx";

const EDUCATION_LEVELS = ["High school", "Bachelor's", "Master's", "PhD", "Other"];

function OptionCard({ selected, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border-2 p-5 text-left transition ${
        selected
          ? "border-brand-500 bg-brand-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
            selected ? "border-brand-600 bg-brand-600" : "border-slate-300"
          }`}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
        <span className="font-semibold text-slate-900">{title}</span>
      </div>
      <p className="mt-1.5 pl-8 text-sm text-slate-600">{description}</p>
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [employmentStatus, setEmploymentStatus] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [company, setCompany] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [targetRole, setTargetRole] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const handleSkip = async () => {
    setError("");
    setSkipping(true);
    try {
      await skipOnboarding();
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't skip right now. Please try again.");
    } finally {
      setSkipping(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!employmentStatus) {
      setError("Please choose whichever describes you best -- or just skip this step.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await updateMyProfile({
        employment_status: employmentStatus,
        current_role: employmentStatus === "experienced" ? currentRole.trim() || null : null,
        company: employmentStatus === "experienced" ? company.trim() || null : null,
        years_experience:
          employmentStatus === "experienced" && yearsExperience ? Number(yearsExperience) : null,
        education_level: employmentStatus === "fresher" ? educationLevel || null : null,
        field_of_study: employmentStatus === "fresher" ? fieldOfStudy.trim() || null : null,
        graduation_year:
          employmentStatus === "fresher" && graduationYear ? Number(graduationYear) : null,
        target_role: targetRole.trim() || null,
      });
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't save that. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Logo dark={false} className="justify-center" />
          <h1 className="mt-5 text-2xl font-bold text-slate-900 sm:text-3xl">
            Tell us a bit about yourself
          </h1>
          <p className="mt-2 text-slate-600">
            This helps us tailor your practice questions. Totally optional -- you can skip and add
            it later from your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <OptionCard
              selected={employmentStatus === "fresher"}
              title="I'm a fresher"
              description="Just starting out or still studying."
              onClick={() => setEmploymentStatus("fresher")}
            />
            <OptionCard
              selected={employmentStatus === "experienced"}
              title="I'm experienced"
              description="Currently working or have prior work experience."
              onClick={() => setEmploymentStatus("experienced")}
            />
          </div>

          {employmentStatus === "experienced" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="currentRole" className="field-label">
                  Current job title
                </label>
                <input
                  id="currentRole"
                  type="text"
                  value={currentRole}
                  onChange={(event) => setCurrentRole(event.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="company" className="field-label">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="yearsExperience" className="field-label">
                  Years of experience
                </label>
                <input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  max="60"
                  value={yearsExperience}
                  onChange={(event) => setYearsExperience(event.target.value)}
                  placeholder="e.g. 3"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {employmentStatus === "fresher" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="educationLevel" className="field-label">
                  Highest education
                </label>
                <select
                  id="educationLevel"
                  value={educationLevel}
                  onChange={(event) => setEducationLevel(event.target.value)}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fieldOfStudy" className="field-label">
                  Field of study
                </label>
                <input
                  id="fieldOfStudy"
                  type="text"
                  value={fieldOfStudy}
                  onChange={(event) => setFieldOfStudy(event.target.value)}
                  placeholder="e.g. Computer Science"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="graduationYear" className="field-label">
                  Graduation year
                </label>
                <input
                  id="graduationYear"
                  type="number"
                  min="1970"
                  max="2100"
                  value={graduationYear}
                  onChange={(event) => setGraduationYear(event.target.value)}
                  placeholder="e.g. 2026"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {employmentStatus && (
            <div>
              <label htmlFor="targetRole" className="field-label">
                What role are you practicing for? <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="targetRole"
                type="text"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="e.g. Frontend Developer"
                className="input-field"
              />
            </div>
          )}

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleSkip}
              disabled={skipping || submitting}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:text-slate-300"
            >
              Skip for now
            </button>
            <Button type="submit" loading={submitting} disabled={skipping} className="w-full sm:w-auto">
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
