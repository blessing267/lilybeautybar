import { api } from "./axios";

export const getDashboardStats = (period = "monthly") =>
  api.get("dashboard-stats/", { params: { period } });
