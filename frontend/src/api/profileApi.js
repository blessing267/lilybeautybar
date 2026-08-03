import { api } from "./axios";

export const getAdminProfile = () =>
  api.get("users/profile-api/");

export const updateAdminProfile = (formData) =>
  api.post("users/profile-api/", formData);