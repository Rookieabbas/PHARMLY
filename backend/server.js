import Medicine from "./models/Medicines.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pharmly";

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch((err) => console.warn(`MongoDB connection notice: ${err.message}. If local MongoDB is not running, provide a cloud MongoDB URI (e.g. MongoDB Atlas) in backend/.env`));
}

app.get("/", (req, res) => {
  res.send("Pharmacy backend running");
});

app.post("/medicine", async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/medicines", async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/search", async (req, res) => {
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

app.get("/expired-medicines", async (req, res) => {
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

app.get("/low-stock", async (req, res) => {
  try {

    const medicines = await Medicine.find({
      quantity: { $lt: 10 }
    });

    res.json(medicines);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete("/medicine/:id", async (req, res) => {
  try {

    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    res.json({ message: "Medicine deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.put("/medicine/:id", async (req, res) => {
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


app.put("/sell/:id", async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const soldQuantity = req.body.quantity;

    if (typeof soldQuantity !== "number") {
      return res.status(400).json({
        message: "Quantity must be a number"
      });
    }

    if(soldQuantity <= 0){
      return res.status(400).json({ message: "Quantity must be greater than zero."})
    };

    // Prevent selling more than available
    if (medicine.quantity < soldQuantity) {
      return res.status(400).json({
        message: "Not enough quantity available"
      });
    }

    medicine.quantity = medicine.quantity - soldQuantity;

    await medicine.save();

    res.json(medicine);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@gmail.com" && password === "123456") {
    res.json({ success: true, token: "admin-token" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
