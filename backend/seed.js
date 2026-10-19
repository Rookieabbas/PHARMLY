import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Medicine from "./models/Medicines.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("Error: MongoDB connection URI is missing from environment variables.");
  process.exit(1);
}

async function seed() {
  try {
    const dataFilePath = path.join(__dirname, "data", "medicines.json");
    if (!fs.existsSync(dataFilePath)) {
      throw new Error(`Data file not found at: ${dataFilePath}`);
    }

    const rawData = fs.readFileSync(dataFilePath, "utf8");
    const parsedData = JSON.parse(rawData);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("No medicines found in data file.");
    }

    // Transform and convert MongoDB Extended JSON $date format into real Date objects
    const seenCodes = new Set();
    const medicines = parsedData.map((item, index) => {
      const code = item.code ? String(item.code).trim() : `MED-${index + 1}`;
      if (seenCodes.has(code)) {
        throw new Error(`Duplicate medicine code detected: ${code}`);
      }
      seenCodes.add(code);

      let dateVal = item.expiryDate;
      if (dateVal && typeof dateVal === "object" && dateVal["$date"]) {
        dateVal = dateVal["$date"];
      }

      const expiryDate = new Date(dateVal);
      if (isNaN(expiryDate.getTime())) {
        throw new Error(`Invalid expiry date for medicine "${item.name}" (${code})`);
      }

      return {
        name: item.name ? String(item.name).trim() : "Unnamed Medicine",
        code: code,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        expiryDate: expiryDate,
      };
    });

    console.log(`Connecting to MongoDB Atlas...`);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    // Replace ONLY the medicines collection; leave users and other collections untouched
    console.log("Clearing existing medicines collection...");
    const deleteResult = await Medicine.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} previous medicines.`);

    console.log(`Inserting ${medicines.length} medicines into the database...`);
    const insertResult = await Medicine.insertMany(medicines);
    console.log(`Seed completed successfully: ${insertResult.length} medicines inserted with ${seenCodes.size} unique codes.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
