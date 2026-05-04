import axios from "axios";

export const login = async (credentials) => {
  const res = await axios.post(
    "/api/token/",
    credentials
  );
  return res.data; // { access, refresh }
};

