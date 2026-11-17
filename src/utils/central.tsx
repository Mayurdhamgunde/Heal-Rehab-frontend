import axios from "axios";

//const baseURL = "http://localhost:5000";
// const baseURL = "https://healtrack.azurewebsites.net"; // ✅ switch easily
//const baseURL = "https://healtracktest.azurewebsites.net"; // ✅ switch easily
const baseURL = "https://rehabhealtrack.azurewebsites.net";

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Automatically attach token if exists
api.interceptors.request.use((config) => {
  const user = localStorage.getItem("user");
  if (user) {
    const { token } = JSON.parse(user);
    console.log("Token:", token);
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔥 THE FIX: Allow browser to handle multipart form data correctly
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

export default api;
