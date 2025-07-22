// src/api.jsx
import axios from "axios";

// Create an Axios instance with a base URL for your API
const API = axios.create({
  baseURL: "https://aaubackend.onrender.com/api",
});

// Use an interceptor to attach the auth token to every request

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- AUTHENTICATION ENDPOINTS ---
export const signUp = (userData) => API.post("/auth/signup", userData);
export const login = (userData) => API.post("/auth/login", userData);
export const logout = () => API.post("/auth/logout");
export const createPartnership = (partnershipData, isMultipart = false) =>
  API.post(
    "/partnership",
    partnershipData,
    isMultipart
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined
  );
export const resetPassword = (data) => API.post("/auth/reset-password", data);
export const getPartnerships = (params) => API.get("/partnership", { params });
export const getPartnershipById = (id) => API.get(`/partnership/${id}`);
export const updatePartnership = (id, data) =>
  API.put(`/partnership/${id}`, data);
export const deletePartnership = (id) => API.delete(`/partnership/${id}`);
export const renewPartnership = (id, data) =>
  API.patch(`/partnership/${id}/renew`, data);
export const approvePartnership = (id) =>
  API.patch(`/partnership/${id}/approve`);
export const rejectPartnership = (id) => API.patch(`/partnership/${id}/reject`);
export const archivePartnership = (id) =>
  API.patch(`/partnership/${id}/archive`);
export const exportPartnerships = () => API.get("/partnership/export");

// --- USER MANAGEMENT ENDPOINTS ---
export const getUsers = () => API.get("/users");
export const addUser = (userData) =>
  API.post("/superadmin/assign-admin", userData);
export const updateUser = (userId, data) =>
  API.put(`/superadmin/users/${userId}`, data);
export const deleteUser = (userId) => API.delete(`/superadmin/users/${userId}`);

// --- NOTIFICATION ENDPOINTS ---
export const getNotifications = (params) =>
  API.get("/notifications", { params });
export const markNotificationAsRead = (id) =>
  API.patch(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () =>
  API.put("/notifications/read-all");
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// --- NOTIFICATION SETTINGS ENDPOINTS ---
export const getNotificationSettings = () => API.get("/notifications/settings");
export const updateNotificationSettings = (preferences) =>
  API.patch("/notifications/settings", { preferences });

// --- USER ACTIVITY LOGS (using notifications as activity logs) ---
export const getUserActivityLogs = (params) =>
  API.get("/notifications", { params });
