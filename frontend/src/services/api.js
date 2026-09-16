import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post("/resume/upload", formData);
};

export const createInterviewSession = (payload) =>
  apiClient.post("/interview/sessions", payload);

export const submitAnswer = (sessionId, payload) =>
  apiClient.post(`/interview/sessions/${sessionId}/answer`, payload);

export const getFeedback = (sessionId) => apiClient.get(`/feedback/${sessionId}`);

export default apiClient;
