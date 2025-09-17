const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'MD_Customer', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'MD_Service', required: true },
  status: { type: String, enum: ['pending','in_progress','completed'], default: 'pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MD_Job', jobSchema);
