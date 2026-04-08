import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isAuthCall = url.includes('/auth/google') ||
                         url.includes('/auth/login')  ||
                         url.includes('/auth/teacher');
      if (!isAuthCall) {
        localStorage.removeItem('sh_token');
        localStorage.removeItem('sh_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(err);
  }
);


export const authAPI = {
  googleAuth:      data => api.post('/auth/google',           data),
  teacherRegister: data => api.post('/auth/teacher/register', data),
  teacherLogin:    data => api.post('/auth/teacher/login',    data),
  login:           data => api.post('/auth/login',            data),
  getMe:           ()   => api.get('/auth/me'),
  updateProfile:   data => api.put('/auth/update-profile', data),
  changePassword:  data => api.put('/auth/change-password', data),
  forgotPassword:  data => api.post('/auth/forgot-password', data),
  resetPassword:   data => api.post('/auth/reset-password',  data),
};


export const studentAPI = {
  getAll:        params     => api.get('/students', { params }),
  getOne:        id         => api.get(`/students/${id}`),
  create:        data       => api.post('/students', data),
  update:        (id, data) => api.put(`/students/${id}`, data),
  delete:        id         => api.delete(`/students/${id}`),
  getStats:      ()         => api.get('/students/stats'),
  resetPassword: (id, data) => api.put(`/students/${id}/reset-password`, data),
};


export const attendanceAPI = {
  mark:          data         => api.post('/attendance', data),
  getByDate:     params       => api.get('/attendance/by-date', { params }),
  getForStudent: (id, params) => api.get(`/attendance/student/${id}`, { params }),
  getClassStats: params       => api.get('/attendance/class-stats', { params }),
};


export const resultAPI = {
  add:           data         => api.post('/results', data),
  getAll:        params       => api.get('/results/all', { params }),
  getForStudent: (id, params) => api.get(`/results/student/${id}`, { params }),
  update:        (id, data)   => api.put(`/results/${id}`, data),
  delete:        id           => api.delete(`/results/${id}`),
  getStats:      params       => api.get('/results/performance-stats', { params }),
};


export const noteAPI = {
  getAll:  ()         => api.get('/notes'),
  create:  data       => api.post('/notes',     data),
  update:  (id, data) => api.put(`/notes/${id}`, data),
  delete:  id         => api.delete(`/notes/${id}`),
};


export const assignmentAPI = {
  getAll:  ()         => api.get('/assignments'),
  create:  data       => api.post('/assignments',     data),
  update:  (id, data) => api.put(`/assignments/${id}`, data),
  delete:  id         => api.delete(`/assignments/${id}`),
};


export const submissionAPI = {
  submit:        (assignmentId, data)    => api.post(`/assignments/${assignmentId}/submit`, data),
  getMySubmission: (assignmentId)        => api.get(`/assignments/${assignmentId}/my-submission`),
  getSubmissions:  (assignmentId)        => api.get(`/assignments/${assignmentId}/submissions`),
  grade:         (submissionId, data)    => api.put(`/assignments/submissions/${submissionId}/grade`, data),
};


export const quizAPI = {
  getAll:          ()         => api.get('/quiz'),
  create:          data       => api.post('/quiz', data),
  update:          (id, data) => api.put(`/quiz/${id}`, data),
  toggle:          id         => api.patch(`/quiz/${id}/toggle`),
  delete:          id         => api.delete(`/quiz/${id}`),
  getResults:      id         => api.get(`/quiz/${id}/results`),
  getStudentList:  ()         => api.get('/quiz/student/list'),
  getQuizToTake:   id         => api.get(`/quiz/student/${id}/take`),
  submitQuiz:      (id, data) => api.post(`/quiz/student/${id}/submit`, data),
};

export default api;


export const premiumAPI = {
  getPlans:          ()   => api.get('/premium/plans'),
  getStatus:         ()   => api.get('/premium/status'),
  initiatePayment:   data => api.post('/premium/initiate-payment', data),
  verifyPayment:     data => api.post('/premium/verify-payment',   data),
  getPaymentHistory: ()   => api.get('/premium/payment-history'),
};


// NOTE: Never set Content-Type manually for FormData uploads.
// Axios auto-sets multipart/form-data + boundary AND keeps Authorization header.
export const videoAPI = {
  getAll:  (params)    => api.get('/videos', { params }),
  create:  (data, onUploadProgress) => api.post('/videos', data, {
    onUploadProgress: onUploadProgress
      ? (e) => onUploadProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  }),
  update:  (id, data)  => api.put(`/videos/${id}`, data),
  remove:  id          => api.delete(`/videos/${id}`),
  view:    id          => api.patch(`/videos/${id}/view`),
};


export const liveAPI = {
  getAll:       (params)   => api.get('/live', { params }),
  create:       data       => api.post('/live', data),
  update:       (id, data) => api.put(`/live/${id}`, data),
  remove:       id         => api.delete(`/live/${id}`),
  updateStatus: (id, data) => api.patch(`/live/${id}/status`, data),
  join:         id         => api.post(`/live/${id}/join`),
};
