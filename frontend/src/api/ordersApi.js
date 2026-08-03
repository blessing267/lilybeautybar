import { api } from "./axios";

export const getAdminOrders = () => api.get("admin-orders/");
export const updateAdminOrder = (id, data) =>
  api.patch(`admin-orders/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  });
