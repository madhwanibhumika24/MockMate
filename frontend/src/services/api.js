import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // The auth session lives in an httpOnly cookie (set by the backend on
  // login/signup/OAuth) -- this makes axios actually send and accept it.
  withCredentials: true,
});

// Returns { filename, status, resume_text }
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post("/resume/upload", formData);
};

// payload: { role, job_description?, resume_text?, resume_filename?, difficulty?, topic? }
// difficulty: "easy" | "medium" | "hard" (defaults to "medium" server-side if omitted)
// topic: e.g. "Python" -- optional, null/omitted lets the LLM infer one instead
// Returns the created session, e.g. { id, role, job_description, difficulty, topic, status, created_at, completed_at }
export const createInterviewSession = (payload) =>
  apiClient.post("/interview/sessions", payload);

export const getInterviewSession = (sessionId) =>
  apiClient.get(`/interview/sessions/${sessionId}`);

// Returns the logged-in user's sessions, most recent first:
// [{ id, role, status, created_at, completed_at, score }, ...]
export const listInterviewSessions = () => apiClient.get("/interview/sessions");

// Returns the full question list so far: [{ id, session_id, order_index, question_text, answer_text, asked_at, answered_at }, ...]
export const getSessionQuestions = (sessionId) =>
  apiClient.get(`/interview/sessions/${sessionId}/questions`);

// payload: { session_id, question_id, answer_text }
// Returns { session_id, status, next_question } -- next_question is null once the session is completed
export const submitAnswer = (sessionId, payload) =>
  apiClient.post(`/interview/sessions/${sessionId}/answer`, payload);

// Ends a session early (e.g. the interview timer running out) without
// requiring all questions to be answered first -- idempotent, safe to call
// more than once. Returns the session with status "completed".
export const endInterviewSession = (sessionId) => apiClient.post(`/interview/sessions/${sessionId}/end`);

// Call once a session's status is "completed" -- idempotent, safe to call again
export const generateFeedback = (sessionId) =>
  apiClient.post(`/feedback/${sessionId}/generate`);

export const getFeedback = (sessionId) => apiClient.get(`/feedback/${sessionId}`);

// ---------- Auth ----------

// payload: { email, password, full_name } -- sets the session cookie on success
export const signup = (payload) => apiClient.post("/auth/signup", payload);

// payload: { email, password } -- sets the session cookie on success
export const login = (payload) => apiClient.post("/auth/login", payload);

export const logout = () => apiClient.post("/auth/logout");

// Returns the logged-in user, or rejects (401) if there's no active session
export const getCurrentUser = () => apiClient.get("/auth/me");

export const requestPasswordReset = (email) => apiClient.post("/auth/reset/request", { email });

export const verifyResetCode = (email, code) => apiClient.post("/auth/reset/verify", { email, code });

export const confirmPasswordReset = (email, code, newPassword) =>
  apiClient.post("/auth/reset/confirm", { email, code, new_password: newPassword });

// Full-page redirects (not axios calls) -- the backend takes it from here and
// sends the browser back to the frontend once the provider round-trip is done.
// ---------- Onboarding / profile ----------

// Returns the current user's onboarding profile -- fields are all null if
// they skipped onboarding or haven't gotten there yet.
export const getMyProfile = () => apiClient.get("/profile/me");

// payload: { employment_status, current_role?, company?, years_experience?,
//            education_level?, field_of_study?, graduation_year?, target_role? }
export const updateMyProfile = (payload) => apiClient.put("/profile/me", payload);

export const skipOnboarding = () => apiClient.post("/profile/skip");

// payload: { resume_text, resume_filename? } -- pair with uploadResume()
// above to parse a file first, then persist the result to the profile.
export const updateMyResume = (payload) => apiClient.put("/profile/resume", payload);

export const deleteMyResume = () => apiClient.delete("/profile/resume");

// payload: { prompt } -- a free-text description of what to practice, e.g.
// "5 hard Python OOP questions". Returns { interpreted: { topic, role,
// difficulty, question_type, count, summary }, questions: [string, ...] }.
// Stateless: no session is created, no answers/feedback are collected.
export const generateAskAIQuestions = (prompt) => apiClient.post("/ask-ai/generate", { prompt });

export const googleLoginUrl = `${API_BASE_URL}/auth/google/login`;
export const githubLoginUrl = `${API_BASE_URL}/auth/github/login`;

export default apiClient;
