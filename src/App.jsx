import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          className: '',
          style: {
            background: '#27272a', // zinc-800
            color: '#e4e4e7', // zinc-200
            border: '1px solid #3f3f46', // zinc-700
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/alerts" element={<Alerts />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;