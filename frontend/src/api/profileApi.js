import { api } from "./axios";

export const getAdminProfile = () => api.get("users/profile-api/");
export const updateAdminProfile = (data) => api.put("users/profile-api/", data);
