import axios from "axios";

export const login = async (credentials) => {
  const res = await axios.post(
    "http://lilybeautybar.onrender.com/api/token/",
    credentials
  );
  return res.data; // { access, refresh }
};

