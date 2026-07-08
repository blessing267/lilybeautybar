import { api } from "./axios";

export const getProducts = () => api.get("dashboard-api/");

export const createProduct = (formData) =>
  api.post("dashboard-api/", formData);

export const updateProduct = (id, formData) => 
  api.put(`dashboard-api/${id}/`, formData);

export const deleteProduct = (id) =>
  api.delete(`dashboard-api/${id}/`);

export const getCategories = () => 
  api.get("categories/");

export const createCategory = (data) =>
  api.post("categories/", data);

export const createSubCategory = (data) =>
  api.post("subcategories/", data);

export const updateCategory = (id, data) =>
  api.put(`categories/${id}/`, data);

export const deleteCategory = (id) =>
  api.delete(`categories/${id}/`);

export const updateSubCategory = (id, data) =>
  api.put(`subcategories/${id}/`, data);

export const deleteSubCategory = (id) =>
  api.delete(`subcategories/${id}/`);