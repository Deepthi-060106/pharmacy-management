import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const customerIdFromUrl = searchParams.get('customerId');
  const fromPrescription = searchParams.get('fromPrescription') === 'true';
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  // ✅ Fetch medicines
  useEffect(() => {
    fetch("http://localhost:5000/api/medicines", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMedicines(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching medicines:", err));
  }, [token]);

  // ✅ Fetch current user (optional — depends if you expose /api/me)
  useEffect(() => {
    fetch("http://localhost:5000/api/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error("Error fetching user:", err));
  }, [token]);

  const meds = useMemo(() => {
    return medicines.filter(m => m.Name?.toLowerCase().includes(q.toLowerCase()));
  }, [q, medicines]);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const proceedToBilling = () => {
    if (selected.length === 0) {
      alert('Select at least one medicine');
      return;
    }
    navigate(`/billing?customerId=${customerIdFromUrl}&medicines=${selected.join(',')}&fromInventory=true&hideNav=true`);
  };

  // ✅ Save (Add or Edit) medicine
  const save = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parsed = {
      Name: formData.get("Name"),
      Batch_No: formData.get("Batch_No"),
      Expiry_Date: formData.get("Expiry_Date"),
      Stock_Quantity: Number(formData.get("Stock_Quantity") || 0),
      Price: Number(formData.get("Price") || 0),
      Category: formData.get("Category") || '',
      Manufacturer: formData.get("Manufacturer") || ''
    };

    const url = editing
      ? `http://localhost:5000/api/medicines/${editing.Medicine_ID}`
      : "http://localhost:5000/api/medicines";

    fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(parsed)
    })
      .then(res => res.json())
      .then(() => {
        setEditing(null);
        return fetch("http://localhost:5000/api/medicines", {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(data => setMedicines(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error saving medicine:", err));
  };

  // ✅ Delete medicine
  const del = (id) => {
    if (!user || user.role !== 'admin') {
      alert('Only admin can delete');
      return;
    }
    if (window.confirm('Delete medicine?')) {
      fetch(`http://localhost:5000/api/medicines/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setMedicines(medicines.filter(m => m.Medicine_ID !== id));
        })
        .catch(err => console.error("Error deleting medicine:", err));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {fromPrescription ? 'Select Medicines' : 'Inventory'}
        </h1>
        <input
          placeholder="Search..."
          className="input max-w-xs"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {!fromPrescription ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* ✅ Add / Edit form */}
          <div className="card">
            <h2 className="font-semibold mb-2">{editing ? 'Edit' : 'Add'} Medicine</h2>
            <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
              <input name="Name" className="input" placeholder="Name" defaultValue={editing?.Name || ''} required />
              <input name="Batch_No" className="input" placeholder="Batch" defaultValue={editing?.Batch_No || ''} required />
              <input name="Expiry_Date" type="date" className="input" defaultValue={editing?.Expiry_Date || ''} required />
              <input name="Stock_Quantity" type="number" className="input" placeholder="Stock" defaultValue={editing?.Stock_Quantity || 0} min="0" required />
              <input name="Price" type="number" step="0.01" className="input" placeholder="Price" defaultValue={editing?.Price || 0} min="0" required />
              <input name="Category" className="input" placeholder="Category" defaultValue={editing?.Category || ''} />
              <input name="Manufacturer" className="input" placeholder="Manufacturer" defaultValue={editing?.Manufacturer || ''} />
              <div className="md:col-span-2 flex gap-2">
                <button className="btn">Save</button>
                {editing && <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 rounded border">Cancel</button>}
              </div>
            </form>
          </div>

          {/* ✅ Medicines list */}
          <div className="card overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">ID</th>
                  <th>Name</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meds.map(m => {
                  const low = (m.Stock_Quantity || 0) <= 10;
                  const soon = new Date(m.Expiry_Date) <= (() => { const x = new Date(); x.setDate(x.getDate() + 30); return x; })();
                  return (
                    <tr key={m.Medicine_ID} className={(low || soon) ? 'bg-yellow-50' : ''}>
                      <td>{m.Medicine_ID}</td>
                      <td className="py-2">{m.Name}</td>
                      <td>{m.Batch_No}</td>
                      <td>{m.Expiry_Date}</td>
                      <td>{m.Stock_Quantity}</td>
                      <td>₹ {Number(m.Price).toFixed(2)}</td>
                      <td>{m.Category || '—'}</td>
                      <td>{m.Manufacturer || '—'}</td>
                      <td className="text-right space-x-2">
                        <button onClick={() => setEditing(m)} className="px-2 py-1 rounded border">Edit</button>
                        <button onClick={() => del(m.Medicine_ID)} className="px-2 py-1 rounded border">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ✅ Prescription flow
        <div className="space-y-4">
          <div className="card overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 w-8"></th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                </tr>
              </thead>
              <tbody>
                {meds.map(m => {
                  const low = (m.Stock_Quantity || 0) <= 10;
                  const soon = new Date(m.Expiry_Date) <= (() => { const x = new Date(); x.setDate(x.getDate() + 30); return x; })();
                  const isSelected = selected.includes(m.Medicine_ID);
                  return (
                    <tr key={m.Medicine_ID} className={(low || soon) ? 'bg-yellow-50' : ''}>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(m.Medicine_ID)}
                          disabled={m.Stock_Quantity <= 0}
                        />
                      </td>
                      <td>{m.Medicine_ID}</td>
                      <td className="py-2">{m.Name}</td>
                      <td>{m.Batch_No}</td>
                      <td>{m.Expiry_Date}</td>
                      <td>{m.Stock_Quantity}</td>
                      <td>₹ {Number(m.Price).toFixed(2)}</td>
                      <td>{m.Category || '—'}</td>
                      <td>{m.Manufacturer || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button
              className="btn"
              onClick={proceedToBilling}
              disabled={selected.length === 0}
            >
              Proceed to Billing ({selected.length} selected)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
