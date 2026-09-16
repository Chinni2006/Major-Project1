import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const registerStudent = (data) => api.post('/students/register', data);
export const loginStudent    = (data) => api.post('/students/login', data);

// ─── Students ─────────────────────────────────────────────────────────────────
export const getStudent      = (id)   => api.get(`/students/${id}`);
export const getAllStudents   = ()     => api.get('/students');
export const deleteStudent   = (id)   => api.delete(`/students/${id}`);

export const uploadFiles = (studentId, files) => {
  const form = new FormData();
  form.append('studentId', studentId);
  files.forEach((f) => form.append('files', f));
  return api.post(`/students/${studentId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getStudentFiles = (id) => api.get(`/students/${id}/files`);

// ─── Analysis ─────────────────────────────────────────────────────────────────
export const analyzeStudent = (id)    => api.post(`/analyze/student/${id}`);
export const getAnalysis    = (id)    => api.get(`/analyze/student/${id}`);
export const analyzeSnippet = (data)  => api.post('/analyze/snippet', data);

// ─── Blockchain ───────────────────────────────────────────────────────────────
export const storeOnBlockchain    = (studentId) => api.post('/blockchain/store', { studentId });
export const getBlockchainRecords = ()           => api.get('/blockchain/records');
export const getBlockchainRecord  = (id)         => api.get(`/blockchain/record/${id}`);
export const getNetworkStatus     = ()           => api.get('/blockchain/status');

// ─── Verification ─────────────────────────────────────────────────────────────
export const verifyStudent          = (studentId, companyName) => api.post('/verify/student', { studentId, companyName });
export const verifyByHash           = (studentId, hash, companyName) => api.post('/verify/hash', { studentId, hash, companyName });
export const getVerificationHistory = (id) => api.get(`/verify/history/${id}`);

// ─── Leaderboard & Public ──────────────────────────────────────────────────────
export const getLeaderboard   = ()   => api.get('/leaderboard');
export const getAllBadges      = ()   => api.get('/leaderboard/badges');
export const getPublicProfile = (id) => api.get(`/leaderboard/profile/${id}`);

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health');

export default api;

// ─── Teacher Auth ──────────────────────────────────────────────────────────────
export const registerTeacher  = (data) => api.post('/teacher/register', data);
export const loginTeacher     = (data) => api.post('/teacher/login', data);

// ─── Teacher Dashboard ─────────────────────────────────────────────────────────
export const getTeacherDashboard = ()        => api.get('/teacher/dashboard');
export const getTeacherStudents  = (params)  => api.get('/teacher/students', { params });
export const getQuizResults      = (quizId)  => api.get(`/teacher/quiz/${quizId}/results`);

// ─── Quiz CRUD (teacher) ───────────────────────────────────────────────────────
export const createQuiz       = (data)             => api.post('/teacher/quiz', data);
export const getTeacherQuizzes= ()                 => api.get('/teacher/quizzes');
export const getTeacherQuiz   = (id)               => api.get(`/teacher/quiz/${id}`);
export const updateQuizMeta   = (id, data)         => api.put(`/teacher/quiz/${id}`, data);
export const deleteQuiz       = (id)               => api.delete(`/teacher/quiz/${id}`);
export const togglePublish    = (id)               => api.post(`/teacher/quiz/${id}/publish`);
export const addQuestion      = (qid, data)        => api.post(`/teacher/quiz/${qid}/question`, data);
export const updateQuestion   = (qid, qqid, data)  => api.put(`/teacher/quiz/${qid}/question/${qqid}`, data);
export const deleteQuestion   = (qid, qqid)        => api.delete(`/teacher/quiz/${qid}/question/${qqid}`);

// ─── Quiz (student) ────────────────────────────────────────────────────────────
export const getAvailableQuizzes = ()           => api.get('/quiz/available');
export const startAttempt        = (quizId)     => api.post(`/quiz/attempt/${quizId}/start`);
export const saveAnswer          = (attId,data) => api.post(`/quiz/attempt/${attId}/answer`, data);
export const logViolation        = (attId,data) => api.post(`/quiz/attempt/${attId}/violation`, data);
export const submitAttempt       = (attId,data) => api.post(`/quiz/attempt/${attId}/submit`, data);
export const getAttemptResult    = (attId)      => api.get(`/quiz/attempt/${attId}/result`);
export const getMyAttempts       = ()           => api.get('/quiz/my-attempts');
