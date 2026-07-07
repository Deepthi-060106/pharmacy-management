// src/api.js
import axios from "axios";

// Create an Axios instance
const api = axios.create({
  // Falls back to localhost for local dev; set REACT_APP_API_URL in
  // your deployment environment (e.g. Vercel project settings) to
  // point at your hosted backend.
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api",
});

// Automatically attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Get token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
