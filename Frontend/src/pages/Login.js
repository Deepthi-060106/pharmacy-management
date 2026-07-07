// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // axios instance

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    try {
      // Call backend login API
      const res = await api.post("/admin/login", { username, password });

      if (res.data.token) {
        // Save JWT token in localStorage
        localStorage.setItem("token", res.data.token);

        // Redirect after successful login
        navigate("/customers");
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-sky-50">
      <form
        onSubmit={handle}
        className="bg-white w-full max-w-sm p-6 rounded-2xl shadow space-y-4"
      >
        <h1 className="text-2xl font-bold">Pharmacy Login</h1>

        <div>
          <label className="block text-sm text-gray-600">Username</label>
          <input
            className="border px-3 py-2 w-full rounded-lg"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Password</label>
          <input
            type="password"
            className="border px-3 py-2 w-full rounded-lg"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700"
        >
          Login
        </button>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
}
