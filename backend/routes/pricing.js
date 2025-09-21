const express = require('express');
const router = express.Router();

// @route   GET /api/pricing
// @desc    Get pricing information
// @access  Public
router.get('/', (req, res) => {
  try {
    const pricing = {
      services: {
        battery: 499,
        fuel: 399,
        mechanical: 599,
        towing: 699,
        lockout: 449,
        tire: 499,
        accident: 749,
        emergency: 999
      },
      pricePerKm: {
        battery: 15,
        fuel: 12,
        mechanical: 18,
        towing: 25,
        lockout: 15,
        tire: 15,
        accident: 30,
        emergency: 35
      },
      currency: 'INR',
      lastUpdated: new Date().toISOString(),
      discounts: {
        firstTime: 10,
        repeatCustomer: 5,
        emergency: 0
      }
    };
    
    res.json(pricing);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
