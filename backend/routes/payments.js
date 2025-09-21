const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const { auth } = require('../middleware/auth');

// @route   POST /api/payments/process
// @desc    Process a payment for a service
// @access  Public (for testing)
router.post('/process', async (req, res) => {
  try {
    const { serviceId, amount, paymentMethod, paymentDetails } = req.body;
    
    // Validate service exists
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if payment already exists for this service
    const existingPayment = await Payment.findOne({ service: serviceId });
    
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ error: 'Payment already processed for this service' });
    }
    
    // Create a unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create payment
    const newPayment = new Payment({
      service: serviceId,
      user: service.user || null,
      amount,
      paymentMethod,
      transactionId,
      status: 'completed', // For demo purposes, mark as completed immediately
      paymentDetails: paymentDetails || {}
    });
    
    const payment = await newPayment.save();
    
    // Update service payment status
    service.paymentStatus = 'completed';
    service.cost = amount;
    await service.save();
    
    res.status(201).json({
      success: true,
      payment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/payments
// @desc    Process a payment for a service
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { serviceId, amount, paymentMethod, paymentDetails } = req.body;
    
    // Validate service exists and belongs to user
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (service.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    // Check if payment already exists for this service
    const existingPayment = await Payment.findOne({ service: serviceId });
    
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ error: 'Payment already processed for this service' });
    }
    
    // Create a unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create payment
    const newPayment = new Payment({
      service: serviceId,
      user: req.user.id,
      amount,
      paymentMethod,
      transactionId,
      status: 'pending',
      paymentDetails: paymentDetails || {}
    });
    
    // Process payment (This is a mock, in real app would integrate with payment gateway)
    // For demo purposes, we'll just mark it as completed
    
    newPayment.status = 'completed';
    
    const payment = await newPayment.save();
    
    // Update service payment status
    service.paymentStatus = 'completed';
    service.cost = amount;
    await service.save();
    
    res.status(201).json(payment);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history for user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('service', 'type status createdAt')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('service', 'type status createdAt');
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check if the payment belongs to the user
    if (payment.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Request a refund
// @access  Private
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const { reason, amount } = req.body;
    
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check if the payment belongs to the user
    if (payment.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Cannot refund a payment that is not completed' });
    }
    
    // Check if already refunded
    if (payment.status === 'refunded') {
      return res.status(400).json({ error: 'Payment already refunded' });
    }
    
    // Process refund (This is a mock, in real app would integrate with payment gateway)
    payment.status = 'refunded';
    payment.refundDetails = {
      amount: amount || payment.amount,
      reason,
      status: 'completed',
      processedAt: new Date()
    };
    
    await payment.save();
    
    // Update service payment status
    const service = await Service.findById(payment.service);
    if (service) {
      service.paymentStatus = 'refunded';
      await service.save();
    }
    
    res.json(payment);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 