import mongoose from "mongoose";

const metaSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    lastResetAt: {
      type: Date,
      default: Date.now,
    },
    count: {
      type: Number,
      default: 0,
    },
    lastManualResetAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Meta || mongoose.model("Meta", metaSchema);
