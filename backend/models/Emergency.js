const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    issue: { type: String, required: true },
    phone: { type: String, required: true },
    vehicleInfo: { type: String },
    status: { type: String, enum: ["pending", "assigned", "resolved"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emergency", emergencySchema);