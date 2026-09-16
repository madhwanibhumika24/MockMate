import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

// Returns { filename, status, resume_text }
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post("/resume/upload", formData);
};

// payload: { role, job_description?, resume_text?, resume_filename? }
// Returns the created session, e.g. { id, role, job_description, status, created_at, completed_at }
export const createInterviewSession = (payload) =>
  apiClient.post("/interview/sessions", payload);

export const getInterviewSession = (sessionId) =>
  apiClient.get(`/interview/sessions/${sessionId}`);

// Returns the full question list so far: [{ id, session_id, order_index, question_text, answer_text, asked_at, answered_at }, ...]
export const getSessionQuestions = (sessionId) =>
  apiClient.get(`/interview/sessions/${sessionId}/questions`);

// payload: { session_id, question_id, answer_text }
// Returns { session_id, status, next_question } -- next_question is null once the session is completed
export const submitAnswer = (sessionId, payload) =>
  apiClient.post(`/interview/sessions/${sessionId}/answer`, payload);

// Call once a session's status is "completed" -- idempotent, safe to call again
export const generateFeedback = (sessionId) =>
  apiClient.post(`/feedback/${sessionId}/generate`);

export const getFeedback = (sessionId) => apiClient.get(`/feedback/${sessionId}`);

export default apiClient;
