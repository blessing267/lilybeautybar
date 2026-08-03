import { api } from "./axios";

export const getCustomers = () =>
  api.get("users/customers-api/");