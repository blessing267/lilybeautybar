import { api } from "./axios";

export const getOrderNotifications = () =>
  api.get("order-notifications/");
