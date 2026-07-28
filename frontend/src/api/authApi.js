import { api } from "./axios";

export const checkSession = async () => {
  const response = await api.get("users/session/status/");
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post(
    "users/session/login/",
    credentials,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("users/session/logout/");
  return response.data;
};