# Pharmly 🏥

A modern, high-performance SaaS platform for pharmacy management. Pharmly streamlines inventory, sales, and user management with a secure, highly-aesthetic, and responsive user interface.

## LIVE ON VERCEL 

https://pharmly-azure.vercel.app/


## 🚀 Features

- **Secure Authentication:** Role-based access control with secure JWT authentication.
- **Inventory Management:** Track medicines, stock levels, and expiry dates efficiently.
- **Point of Sale & Billing:** Real-time billing with voice recognition commands (`react-speech-recognition`).
- **Modern UI/UX:** Built with React 19, TailwindCSS, and Lucide icons for a premium dark-mode experience.
- **RESTful API:** Robust Node.js and Express backend connected to MongoDB.
- **Protected Routes:** Frontend route protection to secure administrative dashboards and inventory.

## 🛠️ Tech Stack

- **Frontend:** React 19 (Vite), TailwindCSS, React Router 7, Lucide Icons, React Hot Toast
- **Backend:** Node.js, Express.js (ES Modules)
- **Database:** MongoDB (via Mongoose)
- **Voice Recognition:** Web Speech API via `react-speech-recognition`

---

## 📦 Getting Started

### Prerequisites

- **Node.js**: v18 or higher (Node.js v22 LTS is configured in your user path)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/pharmly`) or MongoDB Atlas cloud connection string

### Quick Start (Both Backend & Frontend)

From the project root (`c:\Users\ACER\OneDrive\pharmly-abbas\pharmly-main`):

```bash
# Start both backend (port 5000) and frontend (port 5173) together:
npm run dev:all
```

Or double-click `run.bat` in the project root.

---

### Separate Startup

#### 1. Backend Server
```bash
cd backend
npm run dev
```
*Backend runs on: [http://localhost:5000](http://localhost:5000)*

#### 2. Frontend Development Server
```bash
# In the root folder:
npm run dev
```
*Frontend runs on: [http://localhost:5173](http://localhost:5173)*

---

### 🔑 Test Credentials

When opening the login screen at [http://localhost:5173](http://localhost:5173):
- **Email:** `admin@gmail.com`
- **Password:** `123456`

---

### 🍃 Database Setup & Seeding

1. Configure your MongoDB connection string in `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/pharmly
   JWT_SECRET=pharmly_secret_key_123456
   ```
2. Once your MongoDB instance (or MongoDB Atlas cluster) is active, seed the database with sample medicines, alerts, and stock:
   ```bash
   npm run seed
   ```

---

## 🔒 Security

- Environment variables (`.env`) are excluded from Git.
- Sensitive data and passwords adhere to secure authentication flows.
- API endpoints are protected against unauthorized access.
