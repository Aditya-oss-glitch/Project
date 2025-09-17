const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, authTechnician } = require('../middleware/auth');
const Technician = require('../models/Technician');
const multer = require('multer');
const path = require('path');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      phone
    });
    
    // Save user to database
    await user.save();
    
    // Create JWT token
    const payload = {
      userId: user.id
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const payload = {
      userId: user.id
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/technician/register
// @desc    Register a technician
// @access  Public
router.post('/technician/register', async (req, res) => {
  const { name, email, password, phone, specialties, vehicle, licensePlate, latitude, longitude } = req.body;
  try {
    let tech = await Technician.findOne({ email });
    if (tech) {
      return res.status(400).json({ error: 'Technician already exists' });
    }
    // Normalize specialties to match enum
    const allowed = new Set(['battery','fuel','mechanical','towing','tire','lockout','mobile_repair','accident_recovery']);
    const synonyms = {
      'battery jump start': 'battery',
      'jump start': 'battery',
      'fuel delivery': 'fuel',
      'lockout service': 'lockout',
      'flat tire change': 'tire',
      'mobile mechanic': 'mobile_repair',
      'mechanic': 'mechanical'
    };
    const normalizedSpecialties = (Array.isArray(specialties) ? specialties : String(specialties || '').split(','))
      .map(s => String(s || '').toLowerCase().trim())
      .map(s => synonyms[s] || s.replace(/\s+/g, '_').replace(/-/g, '_'))
      .filter(s => allowed.has(s));

    tech = new Technician({
      name,
      email,
      password,
      phone,
      specialties: normalizedSpecialties,
      location: {
        type: 'Point',
        coordinates: [Number(longitude) || 0, Number(latitude) || 0]
      },
      vehicle: vehicle || 'Unknown',
      licensePlate: licensePlate || 'N/A',
      status: 'available'
    });
    await tech.save();
    const payload = { technicianId: tech.id };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        technician: {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          phone: tech.phone
        }
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/technician/login
// @desc    Authenticate technician & get token
// @access  Public
router.post('/technician/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const tech = await Technician.findOne({ email });
    if (!tech) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await tech.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const payload = { technicianId: tech.id };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        technician: {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          phone: tech.phone
        }
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Technician: get profile
router.get('/technician/me', authTechnician, async (req, res) => {
  try {
    const tech = await Technician.findById(req.technician._id).select('-password');
    res.json(tech);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Technician: update profile
router.put('/technician/me', authTechnician, async (req, res) => {
  try {
    const updates = ['name','phone','vehicle','licensePlate','specialties'];
    const body = {};
    
    // Handle specialties normalization
    if (req.body.specialties !== undefined) {
      const allowed = new Set(['battery','fuel','mechanical','towing','tire','lockout','mobile_repair','accident_recovery']);
      const synonyms = {
        'battery jump start': 'battery',
        'jump start': 'battery',
        'fuel delivery': 'fuel',
        'lockout service': 'lockout',
        'flat tire change': 'tire',
        'mobile mechanic': 'mobile_repair',
        'mechanic': 'mechanical'
      };
      const normalizedSpecialties = (Array.isArray(req.body.specialties) ? req.body.specialties : String(req.body.specialties || '').split(','))
        .map(s => String(s || '').toLowerCase().trim())
        .map(s => synonyms[s] || s.replace(/\s+/g, '_').replace(/-/g, '_'))
        .filter(s => allowed.has(s));
      body.specialties = normalizedSpecialties;
    }
    
    for (const key of updates) {
      if (key !== 'specialties' && req.body[key] !== undefined) {
        body[key] = req.body[key];
      }
    }
    
    const tech = await Technician.findByIdAndUpdate(req.technician._id, { $set: body }, { new: true }).select('-password');
    res.json(tech);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Technician: upload avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `tech-${req.technician?._id || 'anon'}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

router.post('/technician/avatar', authTechnician, upload.single('avatar'), async (req, res) => {
  try {
    const url = `/uploads/${req.file.filename}`;
    const tech = await Technician.findByIdAndUpdate(req.technician._id, { $set: { avatarUrl: url } }, { new: true }).select('-password');
    res.json({ avatarUrl: url, technician: tech });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 