import axios from "axios";
import { getAccessToken, logout } from "../auth/auth";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 👇 HANDLE 401 GLOBALLY
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.reload(); // force login
    }
    return Promise.reject(error);
  }
);
