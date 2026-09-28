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

// ---------- Group Discussion ----------

// Returns the fixed list of GD topic categories, e.g. ["Technology & AI", ...]
export const listGDCategories = () => apiClient.get("/group-discussion/categories");

// category is optional -- omit it (or pass undefined) to get every topic.
// Returns [{ id, category, title, prompt }, ...]
export const listGDTopics = (category) =>
  apiClient.get("/group-discussion/topics", { params: category ? { category } : {} });

// Generates AI research content for one topic: an intro, points in favor and
// against (each with an example), and a closing line. Stateless like Ask AI
// -- nothing is saved, and calling it again regenerates fresh content.
// Returns { intro, points_for: [{ point, example }], points_against: [...], conclusion }
export const generateGDTopicBrief = (topicId) =>
  apiClient.post(`/group-discussion/topics/${topicId}/brief`);

// "Search topics with AI" -- researches any topic the candidate types in,
// not just the curated bank. Same response shape as generateGDTopicBrief above.
export const generateCustomGDTopicBrief = (topic) =>
  apiClient.post("/group-discussion/custom-topic/brief", { topic });

// "Discuss with AI" -- a free-form follow-up chat about a topic, layered on
// top of its research brief. Stateless on the backend: pass the running
// conversation as `history` ([{ role: "user" | "ai", content }, ...], not
// including the new `message`) with every call. Returns { reply }.
export const discussGDTopic = ({ topicTitle, topicPrompt, message, history }) =>
  apiClient.post("/group-discussion/discuss", {
    topic_title: topicTitle,
    topic_prompt: topicPrompt || "",
    message,
    history,
  });

// ---------- Aptitude Assessments ----------

// Returns the fixed list of aptitude categories, e.g. ["Quantitative Aptitude", ...]
export const listAptitudeCategories = () => apiClient.get("/aptitude/categories");

// category is optional -- omit it (or pass undefined) to get every topic.
// Returns [{ id, category, title, description }, ...]
export const listAptitudeTopics = (category) =>
  apiClient.get("/aptitude/topics", { params: category ? { category } : {} });

// Generates an MCQ quiz for one topic. Stateless like Ask AI -- nothing is
// saved. Returns { topic_title, difficulty, questions: [{ id, question,
// options, token }, ...] } -- notice there's no correct answer anywhere in
// this response; it's sealed inside each question's "token" until you call
// submitAptitudeQuiz below.
export const generateAptitudeQuiz = (topicId, { difficulty = "medium", count = 5 } = {}) =>
  apiClient.post(`/aptitude/topics/${topicId}/quiz`, null, { params: { difficulty, count } });

// Grades a completed quiz. `answers` is [{ id, token, selected_index }, ...]
// -- selected_index may be null for a question the candidate skipped.
// Returns { score, correct_count, total, results: [{ id, question, options,
// selected_index, correct_index, is_correct, explanation }, ...] }.
export const submitAptitudeQuiz = (answers) => apiClient.post("/aptitude/submit", { answers });

// "Ask AI" -- generates a quiz for any topic the candidate types in, not
// just the curated bank, for when a topic isn't listed. Same response
// shape as generateAptitudeQuiz above.
export const generateCustomAptitudeQuiz = (topic, { difficulty = "medium", count = 5 } = {}) =>
  apiClient.post("/aptitude/custom-topic/quiz", { topic, difficulty, count });

export const googleLoginUrl = `${API_BASE_URL}/auth/google/login`;
export const githubLoginUrl = `${API_BASE_URL}/auth/github/login`;

export default apiClient;
