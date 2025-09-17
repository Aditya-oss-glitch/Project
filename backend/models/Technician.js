const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const technicianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  currentService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  totalServices: {
    type: Number,
    default: 0
  },
  specialties: [{
    type: String,
    enum: [
      'battery',
      'fuel',
      'mechanical',
      'towing',
      'tire',
      'lockout',
      'mobile_repair',
      'accident_recovery'
    ]
  }],
  vehicle: {
    type: String,
    required: true
  },
  licensePlate: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location queries
technicianSchema.index({ location: '2dsphere' });

// Hash password before saving
technicianSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
technicianSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Technician', technicianSchema); 