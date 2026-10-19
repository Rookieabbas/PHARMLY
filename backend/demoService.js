import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Medicine from "./models/Medicines.js";
import Meta from "./models/Meta.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple concurrency lock flag
let isResetting = false;

// In-memory timestamp for manual reset rate limiting (also backed by Meta in DB)
let lastManualResetTimestamp = 0;

/**
 * Calculates the day offset between today and 2026-10-19
 * and shifts an expiry date forward by that many days.
 */
function getShiftedDate(originalDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const baseDate = new Date("2026-10-19T00:00:00.000Z");
  baseDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - baseDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return new Date(originalDate.getTime() + diffDays * 24 * 60 * 60 * 1000);
}

/**
 * Resets the demo data using backend/data/medicines.json as the source of truth.
 * - Deletes all documents in medicines collection and sales/transactions collections.
 * - Leaves the users collection untouched.
 * - Converts Extended JSON $date to real Date and shifts forward by (today - 2026-10-19) days.
 * - Updates lastResetAt in meta collection.
 * - Guarded by isResetting concurrency lock.
 */
export async function resetDemoData() {
  if (isResetting) {
    console.log("[Demo Mode] Reset already in progress. Skipping concurrent run.");
    return { skipped: true, reason: "in_progress" };
  }

  isResetting = true;
  try {
    console.log("[Demo Mode] Starting demo data reset...");

    const dataFilePath = path.join(__dirname, "data", "medicines.json");
    if (!fs.existsSync(dataFilePath)) {
      throw new Error(`Data file not found at: ${dataFilePath}`);
    }

    const rawData = fs.readFileSync(dataFilePath, "utf8");
    const parsedData = JSON.parse(rawData);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("No medicines found in demo data file.");
    }

    const seenCodes = new Set();
    const medicinesToInsert = parsedData.map((item, index) => {
      const code = item.code ? String(item.code).trim() : `MED-${index + 1}`;
      if (seenCodes.has(code)) {
        throw new Error(`Duplicate medicine code detected: ${code}`);
      }
      seenCodes.add(code);

      let dateVal = item.expiryDate;
      if (dateVal && typeof dateVal === "object" && dateVal["$date"]) {
        dateVal = dateVal["$date"];
      }

      const rawDate = new Date(dateVal);
      if (isNaN(rawDate.getTime())) {
        throw new Error(`Invalid expiry date for medicine "${item.name}" (${code})`);
      }

      const shiftedDate = getShiftedDate(rawDate);

      return {
        name: item.name ? String(item.name).trim() : "Unnamed Medicine",
        code: code,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        expiryDate: shiftedDate,
      };
    });

    // 1. Clear medicines collection
    await Medicine.deleteMany({});

    // 2. Clear sales / transactions collections if they exist, but leave users untouched
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map((c) => c.name.toLowerCase());

        if (collectionNames.includes("sales")) {
          await db.collection("sales").deleteMany({});
        }
        if (collectionNames.includes("transactions")) {
          await db.collection("transactions").deleteMany({});
        }
      }
    } catch (err) {
      console.warn("[Demo Mode] Notice while clearing sales/transactions:", err.message);
    }

    // 3. Insert fresh medicines
    const insertResult = await Medicine.insertMany(medicinesToInsert);

    // 4. Update meta collection with lastResetAt
    const now = new Date();
    await Meta.findOneAndUpdate(
      { key: "demo_meta" },
      {
        lastResetAt: now,
        count: insertResult.length,
      },
      { upsert: true, new: true }
    );

    console.log(`[Demo Mode] Reset complete: ${insertResult.length} medicines restored.`);
    return {
      success: true,
      count: insertResult.length,
      lastResetAt: now,
    };
  } catch (error) {
    console.error("[Demo Mode] Reset failed:", error.message);
    throw error;
  } finally {
    isResetting = false;
  }
}

/**
 * Checks if demo data needs automatic reset upon demo user login:
 * - If medicines count is below 900, OR
 * - If lastResetAt is older than 30 minutes (or missing)
 */
export async function checkAndAutoResetOnLogin() {
  try {
    const count = await Medicine.countDocuments();
    const meta = await Meta.findOne({ key: "demo_meta" });

    const lastReset = meta?.lastResetAt ? new Date(meta.lastResetAt) : null;
    const thirtyMinutesMs = 30 * 60 * 1000;
    const isStale = !lastReset || Date.now() - lastReset.getTime() > thirtyMinutesMs;
    const isDepleted = count < 900;

    if (isDepleted || isStale) {
      console.log(
        `[Demo Mode] Triggering auto-reset on login (Count: ${count}, Last reset: ${
          lastReset ? lastReset.toISOString() : "never"
        })`
      );
      await resetDemoData();
      return true;
    }

    return false;
  } catch (err) {
    console.error("[Demo Mode] Auto-reset check failed:", err.message);
    return false;
  }
}

/**
 * Rate limited manual reset (once per 60 seconds).
 */
export async function manualResetRateLimited() {
  const now = Date.now();
  const meta = await Meta.findOne({ key: "demo_meta" });

  const lastManual = meta?.lastManualResetAt
    ? new Date(meta.lastManualResetAt).getTime()
    : lastManualResetTimestamp;

  const cooldownMs = 60 * 1000;
  const elapsed = now - lastManual;

  if (elapsed < cooldownMs) {
    const secondsRemaining = Math.ceil((cooldownMs - elapsed) / 1000);
    const error = new Error(
      `Reset rate limited. Please wait ${secondsRemaining} second${
        secondsRemaining === 1 ? "" : "s"
      } before resetting again.`
    );
    error.status = 429;
    throw error;
  }

  const result = await resetDemoData();

  lastManualResetTimestamp = now;
  await Meta.findOneAndUpdate(
    { key: "demo_meta" },
    { lastManualResetAt: new Date(now) },
    { upsert: true }
  );

  return result;
}
