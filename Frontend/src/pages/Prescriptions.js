import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Prescriptions() {
  const [searchParams] = useSearchParams();
  const customerIdFromUrl = searchParams.get("customerId");
  const isFromCustomer = !!customerIdFromUrl;
  const navigate = useNavigate();

  const [editing, setEditing] = useState(null);
  const [customerId, setCustomerId] = useState(customerIdFromUrl || "");
  const [doctorName, setDoctorName] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [duration, setDuration] = useState("");

  const [medicineList, setMedicineList] = useState([{ medicineId: "", dosage: 1 }]);
  const [customers, setCustomers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/api/customers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching customers:", err));
  }, [token]);

  useEffect(() => {
    fetch("http://localhost:5000/api/medicines", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMedicines(
            data.map((m) => ({
              medicine_id: m.Medicine_ID,
              name: m.Name,
            }))
          );
        }
      })
      .catch((err) => console.error("Error fetching medicines:", err));
  }, [token]);

  const loadPrescriptions = () => {
    fetch("http://localhost:5000/api/prescriptions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPrescriptions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching prescriptions:", err));
  };

  useEffect(() => {
    loadPrescriptions();
  }, [token]);

  const resetForm = () => {
    setEditing(null);
    setDoctorName("");
    setDateIssued("");
    setDuration("");
    setMedicineList([{ medicineId: "", dosage: 1 }]);
  };

  const save = (e) => {
    e.preventDefault();
    if (!customerId || !doctorName || !dateIssued || !duration) {
      alert("Please fill all fields");
      return;
    }

    const validMeds = medicineList.filter((m) => m.medicineId && m.dosage > 0);
    if (validMeds.length === 0) {
      alert("Please add at least one medicine");
      return;
    }

    const data = {
      Doctor_Name: doctorName,
      Date_Issued: dateIssued,
      Customer_ID: customerId,
      Duration: duration,
      medicines: validMeds.map((m) => ({
        Medicine_ID: m.medicineId,
        Dosage: m.dosage,
      })),
    };

    const url = editing
      ? `http://localhost:5000/api/prescriptions/${editing.Prescription_ID}`
      : "http://localhost:5000/api/prescriptions";

    fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(() => {
        resetForm();
        loadPrescriptions();

        if (!editing) {
          navigate("/billing", {
            state: {
              customerId,
              selectedMedicines: validMeds.map((m) => ({
                medicine_id: m.medicineId,
                qty: m.dosage,
              })),
            },
          });
        }
      })
      .catch((err) => console.error(err));
  };

  const del = (id) => {
    if (window.confirm("Delete prescription?")) {
      fetch(`http://localhost:5000/api/prescriptions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(() => {
          setPrescriptions(prescriptions.filter((p) => p.Prescription_ID !== id));
        })
        .catch((err) => console.error(err));
    }
  };

  const addMedicineRow = () => {
    setMedicineList([...medicineList, { medicineId: "", dosage: 1 }]);
  };

  const removeMedicineRow = (index) => {
    const updated = [...medicineList];
    updated.splice(index, 1);
    setMedicineList(updated);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Prescriptions</h1>
      <div className="grid md:grid-cols-2 gap-4">
        
        {/* Form Section */}
        <div className="card space-y-3">
          <h2 className="font-semibold mb-2">{editing ? "Edit" : "Add"} Prescription</h2>
          <form onSubmit={save}>
            <div>
              <label className="block text-sm">Customer</label>
              {isFromCustomer && <p className="text-sm">Customer ID: {customerIdFromUrl}</p>}
              <select
                className="input"
                value={customerId}
                onChange={(e) => !isFromCustomer && setCustomerId(e.target.value)}
                disabled={isFromCustomer}
                required
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.Customer_ID} value={c.Customer_ID}>
                    {c.Customer_ID} - {c.Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm">Doctor Name</label>
              <input className="input" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm">Date Issued</label>
              <input type="date" className="input" value={dateIssued} onChange={(e) => setDateIssued(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm">Duration</label>
              <input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            </div>

            {/* Medicines Section with scroll */}
            <div>
              <label className="block text-sm mb-1">Medicines</label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {medicineList.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 items-center mb-2">
                    {/* Medicine Dropdown */}
                    <select
                      className="input"
                      value={m.medicineId}
                      onChange={(e) => {
                        const updated = [...medicineList];
                        updated[idx].medicineId = e.target.value;
                        setMedicineList(updated);
                      }}
                      required
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((med) => (
                        <option key={med.medicine_id} value={med.medicine_id}>
                          {med.medicine_id} - {med.name}
                        </option>
                      ))}
                    </select>

                    {/* Dosage */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        className="input w-24"
                        value={m.dosage}
                        onChange={(e) => {
                          const updated = [...medicineList];
                          updated[idx].dosage = parseInt(e.target.value) || 1;
                          setMedicineList(updated);
                        }}
                        required
                      />
                      {medicineList.length > 1 && (
                        <button type="button" onClick={() => removeMedicineRow(idx)} className="btn-outline px-2">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addMedicineRow} className="btn-outline mt-2 w-full">
                + Add Medicine
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button className="btn" type="submit">Save</button>
              {editing && (
                <button type="button" onClick={resetForm} className="btn-outline">Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* Prescriptions Table */}
        {!isFromCustomer && (
          <div className="card overflow-auto">
            <h2 className="font-semibold mb-2">Saved Prescriptions</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Medicines</th>
                  <th>Customer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.Prescription_ID}>
                    <td>{p.Prescription_ID}</td>
                    <td>{p.Doctor_Name}</td>
                    <td>{p.Date_Issued}</td>
                    <td>{p.Duration}</td>
                    <td>
                      {Array.isArray(p.Medicines)
                        ? p.Medicines.map((m) => `${m.Name} (x${m.Dosage})`).join(", ")
                        : "-"}
                    </td>
                    <td>{p.Customer_Name || p.Customer_ID}</td>
                    <td className="flex gap-2">
                      <button onClick={() => setEditing(p)} className="btn-outline px-2 py-1">Edit</button>
                      <button onClick={() => del(p.Prescription_ID)} className="btn-outline px-2 py-1">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
