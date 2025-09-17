const express = require('express');
const router = express.Router();
const { authTechnician } = require('../middleware/auth');
const Customer = require('../models/MD_Customer');
const MDService = require('../models/MD_Service');
const Job = require('../models/MD_Job');

// All routes require mechanic auth
router.use(authTechnician);

// Customers
router.get('/customers', async (req, res) => {
  const list = await Customer.find().sort({ createdAt: -1 });
  res.json(list);
});
router.post('/customers', async (req, res) => {
  const { name, phone, note } = req.body;
  const c = await new Customer({ name, phone, note }).save();
  res.status(201).json(c);
});

// Services
router.get('/services', async (req, res) => {
  const list = await MDService.find().sort({ createdAt: -1 });
  res.json(list);
});
router.post('/services', async (req, res) => {
  const { name, price } = req.body;
  const s = await new MDService({ name, price }).save();
  res.status(201).json(s);
});

// Jobs
router.get('/jobs', async (req, res) => {
  const list = await Job.find().sort({ createdAt: -1 }).populate('customer').populate('service');
  res.json(list);
});
router.post('/jobs', async (req, res) => {
  const { customerId, serviceId, notes } = req.body;
  const j = await new Job({ customer: customerId, service: serviceId, notes }).save();
  const full = await j.populate('customer').populate('service');
  res.status(201).json(full);
});
router.put('/jobs/:id', async (req, res) => {
  const { status } = req.body;
  const updated = await Job.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true }).populate('customer').populate('service');
  res.json(updated);
});

module.exports = router;
