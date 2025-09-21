const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const { authTechnician } = require('../middleware/auth');

// @route   GET /api/technicians/:id
// @desc    Get technician by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id).select('-password');
    
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    res.json(technician);
  } catch (error) {
    console.error('Error fetching technician:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/technicians
// @desc    Get all technicians
// @access  Public
router.get('/', async (req, res) => {
  try {
    const technicians = await Technician.find().select('-password');
    res.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/technicians/:id/location
// @desc    Update technician location
// @access  Private (Technician)
router.put('/:id/location', authTechnician, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        }
      },
      { new: true }
    ).select('-password');
    
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    res.json(technician);
  } catch (error) {
    console.error('Error updating technician location:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;