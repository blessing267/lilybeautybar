import axios from "axios";
import { getAccessToken, getRefreshToken, updateAccessToken, logout } from "../auth/auth";

export const api = axios.create({
  baseURL: "https://lilybeautybar.onrender.com/api/",
});

api.defaults.headers.post["Content-Type"] = "multipart/form-data";

// Add access token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically refresh expired access tokens
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          logout();
          window.location.href = "/dashboard/login";
          return Promise.reject(error);
        }

        const response = await axios.post(
          "https://lilybeautybar.onrender.com/api/token/refresh/",
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken = response.data.access;

        updateAccessToken(newAccessToken);

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (refreshError) {
        logout();
        window.location.href = "/dashboard/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
