const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Technician = require("../models/Technician");
const Tracking = require("../models/Tracking");
const { authTechnician } = require("../middleware/auth");

/**
 * @route   POST /api/services
 * @desc    Create a new service request (NO AUTH for testing)
 */
router.post("/", async (req, res) => {
  try {
    const {
      type,
      location,
      address,
      vehicleDetails,
      description,
      contactName,
      contactPhone,
    } = req.body;

    // Debug logging
    console.log("🔍 Service creation request:", {
      type: type,
      location: location,
      address: address,
      contactName: contactName,
      contactPhone: contactPhone,
    });

    // Create new service request
    const newService = new Service({
      type,
      location,
      address,
      vehicleDetails,
      contactName,
      contactPhone,
      description,
      status: "pending",
      priority: type === "emergency" ? "critical" : "normal", // Set priority for SOS requests
    });

    const service = await newService.save();

    // Try to find nearest available technician with matching specialty
    let nearestTechnician = null;

    // For emergency requests, prioritize any available technician
    if (type === "emergency") {
      try {
        nearestTechnician = await Technician.findOne({
          status: "available",
          location: location
            ? {
                $near: {
                  $geometry: location,
                  $maxDistance: 100000, // 100km for emergency
                },
              }
            : undefined,
        }).sort({ rating: -1 }); // Prioritize by rating for emergency
      } catch (_) {
        /* ignore geo query errors when location missing */
      }

      // Fallback for emergency: any available technician
      if (!nearestTechnician) {
        nearestTechnician = await Technician.findOne({
          status: "available",
        }).sort({ rating: -1 });
      }
    } else {
      // Regular service assignment logic
      try {
        nearestTechnician = await Technician.findOne({
          status: "available",
          specialties: { $in: [type] },
          location: location
            ? {
                $near: {
                  $geometry: location,
                  $maxDistance: 50000, // 50km
                },
              }
            : undefined,
        });
      } catch (_) {
        /* ignore geo query errors when location missing */
      }

      // Fallback: pick most recently registered technician
      if (!nearestTechnician) {
        nearestTechnician = await Technician.findOne().sort({ createdAt: -1 });
      }
    }

    if (nearestTechnician) {
      // Assign technician
      service.assignedTechnician = nearestTechnician._id;
      service.status = "assigned";

      nearestTechnician.status = "busy";
      nearestTechnician.currentService = service._id;

      await nearestTechnician.save();
      await service.save();

      // Create tracking record
      const tracking = new Tracking({
        service: service._id,
        technician: nearestTechnician._id,
        status: "assigned",
        location: nearestTechnician.location,
      });

      await tracking.save();
    }

    // Return with technician (if any)
    const withTech = await Service.findById(service._id).populate(
      "assignedTechnician",
      "name phone rating"
    );

    // Debug logging for response
    console.log("🔍 Service created successfully:", {
      id: withTech._id,
      type: withTech.type,
      status: withTech.status,
      contactName: withTech.contactName,
    });

    res.status(201).json(withTech);
  } catch (error) {
    console.error("❌ Error creating service:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/services
 * @desc    Get all services (NO AUTH for testing)
 */
router.get("/", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error("❌ Error fetching services:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/services/assigned/me
 * @desc    Get services assigned to the current technician
 * @access  Private (Technician)
 */
router.get("/assigned/me", authTechnician, async (req, res) => {
  try {
    const services = await Service.find({
      assignedTechnician: req.technician._id,
    })
      .sort({ createdAt: -1 })
      .populate("assignedTechnician", "name phone rating");
    res.json(services);
  } catch (error) {
    console.error("❌ Error fetching my services:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID (NO AUTH for testing)
 */
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      "assignedTechnician",
      "name phone rating"
    );

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("❌ Error fetching service:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   PUT /api/services/:id/status
 * @desc    Update service status (NO AUTH for testing)
 */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Update service status
    service.status = status;

    // If service is completed, update completion time
    if (status === "completed") {
      service.completionTime = new Date();

      if (service.assignedTechnician) {
        const technician = await Technician.findById(
          service.assignedTechnician
        );
        if (technician) {
          technician.status = "available";
          technician.currentService = null;
          technician.totalServices = (technician.totalServices || 0) + 1;
          technician.serviceHistory.push(service._id);
          await technician.save();
        }
      }
    }

    await service.save();

    // Update tracking record
    const tracking = await Tracking.findOne({ service: service._id });
    if (tracking) {
      tracking.status = status;

      if (status === "arrived") {
        tracking.actualArrival = new Date();
      } else if (status === "in_progress") {
        tracking.startTime = new Date();
      } else if (status === "completed") {
        tracking.completionTime = new Date();
      }

      await tracking.save();
    }

    res.json(service);
  } catch (error) {
    console.error("❌ Error updating service status:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   PUT /api/services/:id/rate
 * @desc    Rate a completed service (NO AUTH for testing)
 */
router.put("/:id/rate", async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (service.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Cannot rate a service that is not completed" });
    }

    service.rating = rating;
    service.feedback = feedback;
    await service.save();

    if (service.assignedTechnician) {
      const technician = await Technician.findById(service.assignedTechnician);
      if (technician) {
        const totalServices = technician.totalServices || 1;
        const currentRating = technician.rating || 5;
        technician.rating =
          (currentRating * (totalServices - 1) + rating) / totalServices;
        await technician.save();
      }
    }

    res.json(service);
  } catch (error) {
    console.error("❌ Error rating service:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
/**
 * @route   PUT /api/services/:id/assign/self
 * @desc    Assign the current authenticated technician to the service
 * @access  Private (Technician)
 */
router.put("/:id/assign/self", authTechnician, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });

    // Assign technician
    service.assignedTechnician = req.technician._id;
    service.status = "assigned";
    await service.save();

    // Update technician state
    req.technician.status = "busy";
    req.technician.currentService = service._id;
    await req.technician.save();

    // Ensure tracking exists
    let tracking = await Tracking.findOne({ service: service._id });
    if (!tracking) {
      tracking = new Tracking({
        service: service._id,
        technician: req.technician._id,
        status: "assigned",
        location: req.technician.location,
      });
      await tracking.save();
    } else {
      tracking.technician = req.technician._id;
      tracking.status = "assigned";
      await tracking.save();
    }

    res.json(
      await Service.findById(service._id).populate(
        "assignedTechnician",
        "name phone rating"
      )
    );
  } catch (error) {
    console.error("❌ Error self-assigning:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});
