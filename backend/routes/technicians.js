const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Technician = require('../models/Technician');

// Get all technicians (admin only)
router.get('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const technicians = await Technician.find().select('-password');
        res.json(technicians);
    } catch (error) {
        console.error('Technician fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get technician by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const technician = await Technician.findById(req.params.id).select('-password');
        if (!technician) {
            return res.status(404).json({ message: 'Technician not found' });
        }

        res.json(technician);
    } catch (error) {
        console.error('Technician fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new technician (admin only)
router.post('/',
    auth,
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('phone').trim().notEmpty().withMessage('Phone number is required'),
        body('specialties').isArray().withMessage('Specialties must be an array'),
        body('vehicle.make').trim().notEmpty().withMessage('Vehicle make is required'),
        body('vehicle.model').trim().notEmpty().withMessage('Vehicle model is required'),
        body('vehicle.year').trim().notEmpty().withMessage('Vehicle year is required'),
        body('vehicle.licensePlate').trim().notEmpty().withMessage('License plate is required')
    ],
    async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized' });
            }

            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                name,
                email,
                phone,
                specialties,
                vehicle,
                certifications,
                availability
            } = req.body;

            // Check if technician already exists
            let technician = await Technician.findOne({ email });
            if (technician) {
                return res.status(400).json({ message: 'Technician already exists' });
            }

            // Create new technician
            technician = new Technician({
                name,
                email,
                phone,
                specialties,
                vehicle,
                certifications,
                availability,
                status: 'offline'
            });

            await technician.save();

            res.status(201).json(technician);
        } catch (error) {
            console.error('Technician creation error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Update technician status and location
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, coordinates } = req.body; // expect [lng, lat]
    const technician = await Technician.findById(req.params.id);

    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    // Check if user is the technician or admin
    if (
      req.user._id.toString() !== technician._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (status) technician.status = status;

    // ✅ Store location as GeoJSON
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      technician.location = {
        type: "Point",
        coordinates: coordinates, // [lng, lat]
      };
    }

    await technician.save();
    res.json(technician);
  } catch (error) {
    console.error("Technician status update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update technician profile
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            name,
            phone,
            specialties,
            vehicle,
            certifications,
            availability
        } = req.body;

        const technician = await Technician.findById(req.params.id);

        if (!technician) {
            return res.status(404).json({ message: 'Technician not found' });
        }

        // Check if user is the technician or admin
        if (req.user._id.toString() !== technician._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update fields
        if (name) technician.name = name;
        if (phone) technician.phone = phone;
        if (specialties) technician.specialties = specialties;
        if (vehicle) technician.vehicle = vehicle;
        if (certifications) technician.certifications = certifications;
        if (availability) technician.availability = availability;

        await technician.save();

        res.json(technician);
    } catch (error) {
        console.error('Technician update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete technician (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const technician = await Technician.findById(req.params.id);
        if (!technician) {
            return res.status(404).json({ message: 'Technician not found' });
        }

        // Check if technician is currently assigned to any service
        if (technician.currentService) {
            return res.status(400).json({ message: 'Cannot delete technician with active service' });
        }

        await technician.remove();
        res.json({ message: 'Technician deleted successfully' });
    } catch (error) {
        console.error('Technician deletion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 