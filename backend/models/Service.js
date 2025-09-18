const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "battery",
      "fuel",
      "mechanical",
      "towing",
      "tire",
      "lockout",
      "mobile_repair",
      "mechanic",
      "accident_recovery",
      "emergency",
      "ev_charging",
      "ev_towing",
      "ev_battery_swap",
      "ev_diagnostics",
    ],
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
    default: "pending",
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  address: {
    type: String,
    required: true,
  },
  contactName: String,
  contactPhone: String,
  vehicleDetails: {
    make: String,
    model: String,
    year: String,
    color: String,
    licensePlate: String,
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "cng", "electric", "hybrid"],
    },
  },
  description: {
    type: String,
    required: true,
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Technician",
  },
  estimatedArrival: Date,
  actualArrival: Date,
  completionTime: Date,
  cost: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "refunded"],
    default: "pending",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: String,
  priority: {
    type: String,
    enum: ["normal", "high", "critical"],
    default: "normal",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create geospatial index for location queries
serviceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Service", serviceSchema);
