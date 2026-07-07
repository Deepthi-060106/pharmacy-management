// src/pages/Billing.js
import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

export default function Billing() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const customerIdFromUrl = searchParams.get("customerId");
  const medicinesFromUrl = searchParams.get("medicines");

  const stateCustomerId = location.state?.customerId;
  const stateMedicines = location.state?.selectedMedicines;

  const [customers, setCustomers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [receipt, setReceipt] = useState(null); // ✅ store receipt after payment

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (stateCustomerId) setSelectedCustomer(stateCustomerId);
    else if (customerIdFromUrl) setSelectedCustomer(customerIdFromUrl);
  }, [stateCustomerId, customerIdFromUrl]);

  useEffect(() => {
    fetch("http://localhost:5000/api/customers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data.map(c => ({ id: c.Customer_ID, name: c.Name })));
        }
      })
      .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    fetch("http://localhost:5000/api/medicines", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const normalized = data.map(m => ({
          id: m.Medicine_ID,
          name: m.Name,
          price: Number(m.Price) || 0,
          stock: Number(m.Stock_Quantity) || 0
        }));
        setMedicines(normalized);

        let prefilled = [];
        if (Array.isArray(stateMedicines) && stateMedicines.length > 0) {
          prefilled = stateMedicines.map(sm => {
            const med = normalized.find(m => m.id === parseInt(sm.medicine_id));
            if (!med) return null;
            return { ...med, qty: sm.qty, subtotal: sm.qty * med.price };
          }).filter(Boolean);
        } else if (medicinesFromUrl) {
          prefilled = medicinesFromUrl.split(",").map(pair => {
            const [idStr, qtyStr] = pair.split(":");
            const med = normalized.find(m => m.id === parseInt(idStr));
            if (!med) return null;
            const qty = parseInt(qtyStr) || 1;
            return { ...med, qty, subtotal: qty * med.price };
          }).filter(Boolean);
        }
        if (prefilled.length > 0) setSelectedMedicines(prefilled);
      })
      .catch(err => console.error(err));
  }, [token, stateMedicines, medicinesFromUrl]);

  useEffect(() => {
    setTotal(selectedMedicines.reduce((sum, m) => sum + m.subtotal, 0));
  }, [selectedMedicines]);

  const addMedicine = (id, qty) => {
    const med = medicines.find(m => m.id === parseInt(id));
    if (!med) return;
    setSelectedMedicines(prev => {
      const existing = prev.find(item => item.id === med.id);
      if (existing) {
        return prev.map(item =>
          item.id === med.id
            ? { ...item, qty: item.qty + qty, subtotal: (item.qty + qty) * item.price }
            : item
        );
      } else {
        return [...prev, { ...med, qty, subtotal: med.price * qty }];
      }
    });
  };

  const updateQuantity = (id, qty) => {
    if (qty <= 0) setSelectedMedicines(prev => prev.filter(m => m.id !== id));
    else setSelectedMedicines(prev => prev.map(m => m.id === id ? { ...m, qty, subtotal: qty * m.price } : m));
  };

  const handlePayment = () => {
    if (!selectedCustomer || selectedMedicines.length === 0 || !paymentMethod) {
      alert("Select customer, medicines and payment method first!");
      return;
    }

    const sale = {
      Customer_ID: selectedCustomer,
      Payment_Method: paymentMethod,
      medicines: selectedMedicines.map(m => ({ Medicine_ID: m.id, Quantity: m.qty })),
    };

    fetch("http://localhost:5000/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sale)
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to save sale");
        return res.json();
      })
      .then(data => {
        alert("Payment successful! Sale ID: " + data.sale_id);

        // ✅ Store receipt for display
        setReceipt({
          saleId: data.sale_id,
          customer: customers.find(c => c.id === selectedCustomer)?.name || "Walk-in",
          medicines: selectedMedicines,
          total,
          paymentMethod
        });

        setSelectedMedicines([]);
        setTotal(0);
        setPaymentMethod("");
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Billing</h1>

      <div className="grid md:grid-cols-[1fr_380px] gap-4">
        {/* Medicines List */}
        <div className="card">
          <div className="grid md:grid-cols-2 gap-3">
            {medicines.map(m => (
              <div key={m.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">ID: {m.id} - {m.name}</div>
                  <div className="text-xs text-gray-500">Stock: {m.stock}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹ {m.price.toFixed(2)}</div>
                  <button className="mt-2 px-2 py-1 rounded border" onClick={() => addMedicine(m.id, 1)} disabled={m.stock <= 0}>Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="card">
          <h2 className="font-semibold mb-2">Cart</h2>
          {selectedMedicines.length === 0 ? <p className="text-gray-500">No items added.</p> :
            <div className="space-y-2">
              {selectedMedicines.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium">ID: {m.id} - {m.name}</div>
                    <div className="text-xs text-gray-500">₹ {m.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => updateQuantity(m.id, m.qty - 1)}>-</button>
                    <span>{m.qty}</span>
                    <button className="px-2 py-1 border rounded" onClick={() => updateQuantity(m.id, m.qty + 1)}>+</button>
                  </div>
                  <div className="w-20 text-right">₹ {(m.qty * m.price).toFixed(2)}</div>
                </div>
              ))}
              <hr />
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹ {total.toFixed(2)}</span>
              </div>
              <div className="mt-2">
                <label className="block text-sm text-gray-600">Customer</label>
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="input">
                  <option value="">Walk-in</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}
                </select>
              </div>
              <div className="mt-2">
                <label className="block text-sm text-gray-600">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input" required>
                  <option value="">Select Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <button className="btn w-full mt-2" onClick={handlePayment}>Generate Bill</button>
            </div>
          }
        </div>
      </div>

      {/* ✅ Receipt display */}
      {receipt && (
        <div className="card mt-6 p-4 border rounded shadow-lg bg-white">
          <h2 className="font-bold text-xl mb-2">Receipt</h2>
          <p><strong>Sale ID:</strong> {receipt.saleId}</p>
          <p><strong>Customer:</strong> {receipt.customer}</p>
          <p><strong>Payment Method:</strong> {receipt.paymentMethod}</p>
          <div className="mt-2">
            <table className="w-full text-left border">
              <thead>
                <tr className="border-b">
                  <th className="p-1">ID</th>
                  <th className="p-1">Name</th>
                  <th className="p-1">Qty</th>
                  <th className="p-1">Price</th>
                  <th className="p-1">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {receipt.medicines.map((m, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-1">{m.id}</td>
                    <td className="p-1">{m.name}</td>
                    <td className="p-1">{m.qty}</td>
                    <td className="p-1">₹ {m.price.toFixed(2)}</td>
                    <td className="p-1">₹ {m.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-bold mt-2 text-right">Total: ₹ {receipt.total.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
