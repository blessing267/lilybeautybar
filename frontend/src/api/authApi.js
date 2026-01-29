import axios from "axios";

export const login = async (credentials) => {
  const res = await axios.post(
    "http://127.0.0.1:8000/api/token/",
    credentials
  );
  return res.data; // { access, refresh }
};

