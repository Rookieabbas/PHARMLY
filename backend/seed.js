import mongoose from "mongoose";
import dotenv from "dotenv";
import Medicine from "./models/Medicines.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pharmly";

const sampleMedicines = [
  {
    name: "Paracetamol 500mg",
    code: "PCM500",
    price: 15,
    quantity: 45,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // ~6 months future
  },
  {
    name: "Azithral 500",
    code: "AZ500",
    price: 120,
    quantity: 25,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year future
  },
  {
    name: "Paracetamol 650mg",
    code: "PCM650",
    price: 18,
    quantity: 6, // Low stock alert
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Amoxicillin 250",
    code: "AMX250",
    price: 80,
    quantity: 3, // Low stock alert
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    name: "Cetirizine 10mg",
    code: "CTZ10",
    price: 35,
    quantity: 50,
    expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired alert
  },
  {
    name: "Cough Syrup 100ml",
    code: "CS100",
    price: 95,
    quantity: 12,
    expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired alert
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected. Clearing existing medicines...");
    await Medicine.deleteMany({});
    console.log("Inserting sample medicines...");
    await Medicine.insertMany(sampleMedicines);
    console.log("Seed completed successfully with", sampleMedicines.length, "medicines.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
