import { api } from "./axios";

export const getProducts = () => api.get("dashboard-api/");

export const createProduct = (formData) =>
  api.post("dashboard-api/", formData);

export const updateProduct = (id, formData) => 
  api.put(`dashboard-api/${id}/`, formData);

export const deleteProduct = (id) =>
  api.delete(`dashboard-api/${id}/`);
