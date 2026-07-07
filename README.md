# 💊 Pharmacy Management System

A full-stack web application for managing a pharmacy's day-to-day operations — customers, medicine inventory, prescriptions, and billing/sales — with role-based admin authentication and automated low-stock/expiry alerts.

🔗 **Live demo (frontend):** [pharmacy-managament.vercel.app](https://pharmacy-managament.vercel.app)

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)
![Flask](https://img.shields.io/badge/Backend-Flask-000000?logo=flask&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)

---

## 📌 Overview

Running a pharmacy means juggling customer records, prescriptions, stock levels, expiry dates, and daily sales — often across spreadsheets and paper. This project brings it all into one admin dashboard:

- Secure **JWT-based admin login**
- Full **CRUD** for customers and medicines
- **Prescriptions** linked to customers, each holding multiple medicines with dosage info
- **Billing/Sales** that automatically deduct stock and calculate totals
- A **background scheduler** that checks every few minutes for low-stock and expired medicines and logs alerts

## ✨ Features

- 🔐 JWT authentication with an admin-only decorator protecting sensitive routes
- 👥 Customer management (add, list)
- 💊 Medicine inventory management (add, list, stock tracking, batch numbers, expiry dates)
- 📋 Prescriptions with multiple medicines per prescription (many-to-many via junction table)
- 🧾 Sales/billing with automatic stock deduction and total calculation
- ⏰ Background job (APScheduler) that alerts on low stock (<10 units) and expired medicines
- 🎨 Clean, responsive UI built with React + Tailwind CSS

## 🛠️ Tech Stack

**Frontend:** React 18, React Router, Tailwind CSS, Axios
**Backend:** Flask, Flask-JWT-Extended, Flask-CORS, APScheduler
**Database:** MySQL

## 🗂️ Project Structure

```
.
├── app.py                     # Flask backend — all API routes
├── DatabaseSchema.sql         # Table definitions (Customers, Medicines, Prescriptions, Sales, etc.)
├── Insert_values.sql          # Sample seed data
├── checking.sql               # Quick SELECT queries for sanity-checking tables
├── requirements.txt           # Python dependencies
├── .env.example                # Backend environment variable template
└── Frontend/
    ├── src/
    │   ├── App.js              # Route definitions
    │   ├── api.js               # Axios instance (JWT auto-attach, configurable API URL)
    │   ├── components/
    │   │   └── ProtectedRoute.js
    │   └── pages/
    │       ├── Login.js
    │       ├── Inventory.js
    │       ├── Billing.js
    │       ├── Customers.js
    │       └── Prescriptions.js
    ├── .env.example             # Frontend environment variable template
    ├── package.json
    └── tailwind.config.js
```

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/register` | — | Register a new admin |
| POST | `/api/admin/login` | — | Log in, returns JWT |
| GET | `/api/customers` | Admin | List all customers |
| POST | `/api/customers` | Admin | Add a customer |
| GET | `/api/medicines` | JWT | List all medicines |
| POST | `/api/medicines` | Admin | Add a medicine |
| GET | `/api/prescriptions` | Admin | List prescriptions with linked medicines |
| POST | `/api/prescriptions` | Admin | Create a prescription (with medicines + dosage) |
| POST | `/api/sales` | Admin | Record a sale, deducts stock automatically |

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- MySQL Server

### 1. Clone the repo
```bash
git clone https://github.com/Deepthi-060106/pharmacy-management.git
cd pharmacy-management
```

### 2. Set up the database
```bash
mysql -u root -p < DatabaseSchema.sql
mysql -u root -p < Insert_values.sql   # optional sample data
```

### 3. Backend setup
```bash
pip install -r requirements.txt
cp .env.example .env
```
Edit `.env` with your real MySQL credentials and a strong JWT secret, then run:
```bash
python app.py
```
The API will be live at `http://127.0.0.1:5000`.

### 4. Frontend setup
```bash
cd Frontend
npm install
cp .env.example .env
```
Edit `.env` if your backend isn't running on the default local port, then run:
```bash
npm start
```
The app will be live at `http://localhost:3000`.

## ☁️ Deployment

- **Frontend** is deployed on **Vercel**: [pharmacy-managament.vercel.app](https://pharmacy-managament.vercel.app)
- **Backend**: Vercel is built for serverless functions, not a great fit for a long-running Flask app with a background scheduler and a persistent MySQL connection. Better options are **Render**, **Railway**, or a small VPS. Whichever you choose:
  1. Set the environment variables from `.env.example` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET_KEY`) in that platform's dashboard.
  2. Use a managed MySQL instance (Railway, PlanetScale, or your host's MySQL add-on) rather than `localhost`.
  3. Once deployed, set `REACT_APP_API_URL` in your Vercel project's environment variables to point at the live backend URL, then redeploy the frontend.

## 🔒 Security Notes

- Database credentials and the JWT secret are read from environment variables (`.env`, git-ignored) rather than hardcoded — **make sure you never commit a real `.env` file**.
- Admin passwords are currently stored in plain text in the `Admins` table (see `Insert_values.sql`). For any real-world use, hash passwords with `bcrypt` or `werkzeug.security` before storing and comparing them.
- `JWT_SECRET_KEY` should be a long, random string in production — never reuse the example value.

## 🔮 Future Improvements

- Hash admin passwords instead of storing them in plain text
- Add pagination and search/filtering on inventory and customer lists
- Role-based access beyond admin/non-admin (e.g. pharmacist, cashier)
- Deploy the backend and connect it to the live Vercel frontend
- Add automated tests for API routes

## 📄 License

This project is open for learning and personal use. Feel free to fork and build on it — attribution appreciated.
