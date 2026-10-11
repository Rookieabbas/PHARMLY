import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: String,
  code: String,
  price: Number,
  quantity: Number,
  expiryDate: Date
});

export default mongoose.model("Medicine", medicineSchema);