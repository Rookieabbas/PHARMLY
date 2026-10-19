import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./utils/themeContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3500,
            className: "notion-toast",
            style: {
              background: "var(--notion-bg)",
              color: "var(--notion-text)",
              border: "1px solid var(--notion-border)",
              boxShadow: "var(--notion-shadow-popover)",
              borderRadius: "6px",
              fontSize: "13px",
              padding: "10px 14px",
            },
            success: {
              iconTheme: {
                primary: "#2383E2",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EB5757",
                secondary: "#ffffff",
              },
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
    </ThemeProvider>
  );
}

export default App;