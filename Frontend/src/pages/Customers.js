// src/pages/Customers.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // axios instance

export default function Customers() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // -------------------------
  // Load customers from API
  // -------------------------
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // -------------------------
  // Save (Add or Edit)
  // -------------------------
  const save = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const token = localStorage.getItem("token");

    try {
      if (editing) {
        // update
        await api.put(`/customers/${editing.Customer_ID}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // add new
        await api.post("/customers", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setEditing(null);
      fetchCustomers();
    } catch (err) {
      console.error("Error saving customer:", err);
    }
  };

  // -------------------------
  // Delete
  // -------------------------
  const del = async (id) => {
    if (!window.confirm("Delete customer?")) return;
    const token = localStorage.getItem("token");
    try {
      await api.delete(`/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCustomers();
    } catch (err) {
      console.error("Error deleting customer:", err);
    }
  };

  // -------------------------
  // Filtered list
  // -------------------------
  const filtered = customers.filter((c) =>
    c.Name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <input
          placeholder="Search..."
          className="input max-w-xs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Add / Edit Form */}
        <div className="card">
          <h2 className="font-semibold mb-2">
            {editing ? "Edit" : "Add"} Customer
          </h2>
          {editing && (
            <div className="mb-2 p-2 bg-gray-100 rounded">
              ID: {editing.Customer_ID}
            </div>
          )}
          <form onSubmit={save} className="grid gap-3">
            <input
              name="Name"
              className="input"
              placeholder="Full Name"
              defaultValue={editing?.Name || ""}
              required
            />
            <input
              name="Email"
              type="email"
              className="input"
              placeholder="Email"
              defaultValue={editing?.Email || ""}
              required
            />
            <input
              name="Phone_Number"
              className="input"
              placeholder="Phone"
              defaultValue={editing?.Phone_Number || ""}
              required
            />
            <div className="flex gap-2">
              <button className="btn">Save</button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-2 rounded border"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card overflow-auto">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.Customer_ID}>
                    <td className="py-2">{c.Customer_ID}</td>
                    <td>{c.Name}</td>
                    <td>{c.Email}</td>
                    <td>{c.Phone_Number}</td>
                    <td className="text-right space-x-2">
                      <button
                        className="px-2 py-1 rounded border bg-blue-100 text-blue-700"
                        onClick={() =>
                          navigate(
                            `/prescriptions?customerId=${c.Customer_ID}&hideNav=true`
                          )
                        }
                      >
                        With Prescription
                      </button>
                      <button
                        className="px-2 py-1 rounded border bg-green-100 text-green-700"
                        onClick={() =>
                          navigate(
                            `/inventory?customerId=${c.Customer_ID}&fromPrescription=true&hideNav=true`
                          )
                        }
                      >
                        Choose Medicines
                      </button>
                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => setEditing(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => del(c.Customer_ID)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
