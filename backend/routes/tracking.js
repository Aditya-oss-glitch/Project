const express = require('express');
const router = express.Router();
const Tracking = require('../models/Tracking');
const Service = require('../models/Service');
const { auth } = require('../middleware/auth');
const { authTechnician } = require('../middleware/auth');

// @route   GET /api/tracking/:serviceId
// @desc    Get tracking information for a service
// @access  Private
router.get('/:serviceId', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId)
      .populate('assignedTechnician', 'name phone rating');
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if the service belongs to the user or the technician is assigned to it
    if (service.user.toString() !== req.user.id && 
        (!req.technician || service.assignedTechnician.toString() !== req.technician.id)) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const tracking = await Tracking.findOne({ service: req.params.serviceId })
      .populate('technician', 'name phone location rating');

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking information not found' });
    }

    // ✅ Combine service info (like type) into tracking response
    res.json({
      ...tracking.toObject(),
      serviceType: service.type,   // include the booked service type
      serviceStatus: service.status,
      vehicleDetails: service.vehicleDetails,
      address: service.address
    });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/tracking/:serviceId/location
// @desc    Update technician location for a service
// @access  Private (Technician only)
router.put('/:serviceId/location', authTechnician, async (req, res) => {
  try {
    const { location } = req.body;
    
    const service = await Service.findById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if the technician is assigned to this service
    if (service.assignedTechnician.toString() !== req.technician.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    // Update technician location
    req.technician.location = location;
    await req.technician.save();
    
    // Update tracking information
    const tracking = await Tracking.findOne({ service: req.params.serviceId });
    
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking information not found' });
    }
    
    tracking.location = location;
    await tracking.save();
    
    res.json(tracking);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/tracking/:serviceId/eta
// @desc    Update estimated arrival time for a service
// @access  Private (Technician only)
router.put('/:serviceId/eta', authTechnician, async (req, res) => {
  try {
    const { estimatedArrival } = req.body;
    
    const service = await Service.findById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if the technician is assigned to this service
    if (service.assignedTechnician.toString() !== req.technician.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    // Update service with estimated arrival time
    service.estimatedArrival = estimatedArrival;
    await service.save();
    
    // Update tracking information
    const tracking = await Tracking.findOne({ service: req.params.serviceId });
    
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking information not found' });
    }
    
    tracking.estimatedArrival = estimatedArrival;
    await tracking.save();
    
    res.json(tracking);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/tracking/:serviceId/notes
// @desc    Add note to tracking information
// @access  Private (Technician only)
router.post('/:serviceId/notes', authTechnician, async (req, res) => {
  try {
    const { text } = req.body;
    
    const service = await Service.findById(req.params.serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if the technician is assigned to this service
    if (service.assignedTechnician.toString() !== req.technician.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    // Add note to tracking information
    const tracking = await Tracking.findOne({ service: req.params.serviceId });
    
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking information not found' });
    }
    
    const note = {
      text,
      timestamp: new Date()
    };
    
    tracking.notes.push(note);
    await tracking.save();
    
    res.json(tracking);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 