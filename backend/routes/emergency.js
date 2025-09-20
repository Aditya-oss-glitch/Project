const express = require("express");
const router = express.Router();
const Emergency = require("../models/Emergency");

// Create new emergency request
router.post("/", async (req, res) => {
  try {
    const { location, issue, phone, vehicleInfo } = req.body;

    if (!location || !issue || !phone) {
      return res.status(400).json({ error: "Location, issue, and phone are required" });
    }

    const emergency = new Emergency({ location, issue, phone, vehicleInfo });
    await emergency.save();

    res.status(201).json({
      message: "Emergency request created successfully",
      requestId: emergency._id,
      emergency,
    });
  } catch (err) {
    console.error("Error creating emergency:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all emergencies (for admin/technicians)
router.get("/", async (req, res) => {
  try {
    const emergencies = await Emergency.find().sort({ createdAt: -1 });
    res.json(emergencies);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update emergency status (assign/resolved)
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!emergency) return res.status(404).json({ error: "Emergency not found" });
    res.json(emergency);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;