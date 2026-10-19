import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Medicine from "./models/Medicines.js";
import Meta from "./models/Meta.js";
import {
  resetDemoData,
  checkAndAutoResetOnLogin,
  manualResetRateLimited,
} from "./demoService.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Normalize leading double slashes in requests (e.g., //api/auth/login -> /api/auth/login)
app.use((req, res, next) => {
  if (req.url.startsWith("//")) {
    req.url = req.url.replace(/^\/+/, "/");
  }
  next();
});

// Authentication & Demo User Identification Middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  const xDemoHeader = req.headers["x-demo-user"];

  if (token === "demo-token" || xDemoHeader === "true") {
    req.user = { email: "demo@pharmly.com", role: "demo", isDemo: true };
  } else if (token === "admin-token") {
    req.user = { email: "admin@gmail.com", role: "admin", isDemo: false };
  } else {
    req.user = { email: "guest", role: "guest", isDemo: false };
  }
  next();
};

app.use(authenticateUser);

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/pharmly";

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch((err) =>
      console.warn(
        `MongoDB connection notice: ${err.message}. If local MongoDB is not running, provide a cloud MongoDB URI (e.g. MongoDB Atlas) in backend/.env`
      )
    );
}

// Health check endpoint
app.get(["/", "/api"], (req, res) => {
  res.send("Pharmacy backend running");
});

// ==========================================
// AUTHENTICATION & LOGIN
// ==========================================
app.post(["/api/auth/login", "/auth/login"], async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    const demoEmail = (process.env.DEMO_EMAIL || "demo@pharmly.com").trim().toLowerCase();
    const demoPassword = (process.env.DEMO_PASSWORD || "demo123").trim();

    // Match demo user (demo@pharmly.com or demo@gmail.com)
    const isDemoUser =
      (email === demoEmail && password === demoPassword) ||
      (email === "demo@gmail.com" && (password === "123456" || password === demoPassword)) ||
      (email === demoEmail && password === "123456");

    // Match admin user (admin@gmail.com / 123456)
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD || "123456").trim();
    const isAdminUser = email === adminEmail && password === adminPassword;

    if (isDemoUser) {
      // Requirement 2: When demo user logs in, if count < 900 or lastResetAt > 30 mins, run resetDemoData()
      await checkAndAutoResetOnLogin();

      return res.json({
        success: true,
        token: "demo-token",
        isDemo: true,
        role: "demo",
        email: email,
      });
    }

    if (isAdminUser) {
      return res.json({
        success: true,
        token: "admin-token",
        isDemo: false,
        role: "admin",
        email: email,
      });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error during login" });
  }
});

// ==========================================
// DEMO RESET ENDPOINT (Requirement 3)
// ==========================================
app.post(["/api/demo/reset", "/demo/reset"], async (req, res) => {
  // Only demo user or admin can trigger manual reset
  if (!req.user || (req.user.role !== "demo" && req.user.role !== "admin")) {
    return res.status(403).json({
      error: "Disabled in demo mode",
      message: "Forbidden: Only authorized demo users or admins can reset demo data",
    });
  }

  try {
    const result = await manualResetRateLimited();
    res.json({
      success: true,
      message: "Demo data reset successfully",
      count: result.count,
      lastResetAt: result.lastResetAt,
    });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({
        error: "Rate limited",
        message: error.message,
      });
    }
    console.error("Manual reset failed:", error);
    res.status(500).json({ error: error.message || "Failed to reset demo data" });
  }
});

// ==========================================
// DEMO USER GUARDS (Requirement 1)
// ==========================================

// Guard: Bulk delete is blocked in demo mode
app.delete(
  ["/medicines", "/api/medicines", "/medicine/bulk", "/api/medicine/bulk"],
  (req, res) => {
    if (req.user?.isDemo) {
      return res.status(403).json({
        error: "Disabled in demo mode",
        message: "Disabled in demo mode",
      });
    }
    res.status(400).json({ message: "Specify an ID to delete" });
  }
);

// Guard: Password changes and user/account management blocked in demo mode
app.use(
  [
    "/api/auth/password",
    "/auth/password",
    "/api/auth/change-password",
    "/auth/change-password",
    "/api/users",
    "/api/user",
    "/users",
    "/user",
  ],
  (req, res) => {
    if (req.user?.isDemo) {
      return res.status(403).json({
        error: "Disabled in demo mode",
        message: "Disabled in demo mode",
      });
    }
    res.status(404).json({ message: "Endpoint not found" });
  }
);

// ==========================================
// MEDICINES API (Allows normal actions)
// ==========================================

// Add new medicine record
app.post(["/medicine", "/api/medicine"], async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all medicines
app.get(["/medicines", "/api/medicines"], async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search medicines by name or code
app.get(["/search", "/api/search"], async (req, res) => {
  try {
    const query = req.query.name || req.query.q || "";
    if (!query.trim()) {
      return res.json([]);
    }

    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: query.trim(), $options: "i" } },
        { code: { $regex: query.trim(), $options: "i" } },
      ],
    });

    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expired medicines
app.get(["/expired-medicines", "/api/expired-medicines"], async (req, res) => {
  try {
    const today = new Date();
    const medicines = await Medicine.find({
      expiryDate: { $lt: today },
    });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock medicines
app.get(["/low-stock", "/api/low-stock"], async (req, res) => {
  try {
    const medicines = await Medicine.find({
      quantity: { $lt: 10 },
    });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete medicine:
// Requirement 1: For demo user, block deleting a medicine that has stock with 403 "Disabled in demo mode".
// Deleting zero-stock (expired/depleted) medicines or admin delete is allowed.
app.delete(["/medicine/:id", "/api/medicine/:id"], async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // Block demo user from deleting medicines that still have stock
    if (req.user?.isDemo && (Number(medicine.quantity) || 0) > 0) {
      return res.status(403).json({
        error: "Disabled in demo mode",
        message: "Disabled in demo mode",
      });
    }

    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit medicine (price, quantity, expiryDate, name, code)
app.put(["/medicine/:id", "/api/medicine/:id"], async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Point of Sale / Billing: Sell medicine quantity
app.put(["/sell/:id", "/api/sell/:id"], async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const soldQuantity = req.body.quantity;

    if (typeof soldQuantity !== "number") {
      return res.status(400).json({
        message: "Quantity must be a number",
      });
    }

    if (soldQuantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero.",
      });
    }

    // Prevent selling more than available
    if (medicine.quantity < soldQuantity) {
      return res.status(400).json({
        message: "Not enough quantity available",
      });
    }

    medicine.quantity = medicine.quantity - soldQuantity;
    await medicine.save();

    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
