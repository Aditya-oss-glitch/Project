const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Technician = require('../models/Technician');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const authTechnician = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const technician = await Technician.findOne({ _id: decoded.technicianId });

    if (!technician) {
      throw new Error();
    }

    req.token = token;
    req.technician = technician;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate as a technician.' });
  }
};

module.exports = { auth, authTechnician }; 