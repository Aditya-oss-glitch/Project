const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'en_route', 'arrived', 'in_progress', 'completed'],
    default: 'assigned'
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
  estimatedArrival: {
    type: Date
  },
  actualArrival: {
    type: Date
  },
  startTime: {
    type: Date
  },
  completionTime: {
    type: Date
  },
  notes: [{
    text: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  distance: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location queries
trackingSchema.index({ location: '2dsphere' });

// Update the updatedAt timestamp before saving
trackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Tracking', trackingSchema); 