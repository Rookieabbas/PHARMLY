import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Medicine from "../backend/models/Medicines.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://abbasraza0865_db_user:23UzVK0JkzcIYjdA@pharmacy-cluster.barjiku.mongodb.net/pharmly?retryWrites=true&w=majority";

// Connection caching for Vercel Serverless
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!MONGO_URI) {
    console.warn("No MongoDB URI configured.");
    return null;
  }

  try {
    cachedConnection = await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB via serverless function");
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB Serverless connection error:", error.message);
    throw error;
  }
}

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn("DB connection warning in middleware:", err.message);
  }
  next();
});

// Root check
app.get(["/", "/api"], (req, res) => {
  res.json({ message: "Pharmly API is running live on Vercel" });
});

// Auth Login
app.post(["/api/auth/login", "/auth/login"], (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const password = (req.body.password || "").trim();

  if (email === "admin@gmail.com" && password === "123456") {
    res.json({ success: true, token: "admin-token" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Add Medicine
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

// Search medicines
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

// Expired medicines
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

// Low stock medicines
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

// Delete medicine
app.delete(["/medicine/:id", "/api/medicine/:id"], async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medicine
app.put(["/medicine/:id", "/api/medicine/:id"], async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sell medicine
app.put(["/sell/:id", "/api/sell/:id"], async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const soldQuantity = req.body.quantity;

    if (typeof soldQuantity !== "number") {
      return res.status(400).json({ message: "Quantity must be a number" });
    }

    if (soldQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero." });
    }

    if (medicine.quantity < soldQuantity) {
      return res.status(400).json({ message: "Not enough quantity available" });
    }

    medicine.quantity = medicine.quantity - soldQuantity;
    await medicine.save();
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
