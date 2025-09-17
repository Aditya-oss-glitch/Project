const jwt = require('jsonwebtoken');
const Service = require('../models/Service');
const Tracking = require('../models/Tracking');
const User = require('../models/User');
const Technician = require('../models/Technician');

module.exports = (io) => {
    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join service tracking room
        socket.on('join:service', async (serviceId) => {
            try {
                const service = await Service.findById(serviceId);
                if (!service) {
                    socket.emit('error', { message: 'Service not found' });
                    return;
                }

                // Check if user is authorized to join this room
                if (service.user.toString() !== socket.user._id.toString() &&
                    service.assignedTechnician.toString() !== socket.user._id.toString()) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                socket.join(`service:${serviceId}`);
                console.log(`Client ${socket.id} joined service room ${serviceId}`);
            } catch (error) {
                console.error('Join service error:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Leave service tracking room
        socket.on('leave:service', (serviceId) => {
            socket.leave(`service:${serviceId}`);
            console.log(`Client ${socket.id} left service room ${serviceId}`);
        });

        // Update technician location
        socket.on('location:update', async (data) => {
            try {
                const { serviceId, location } = data;
                const service = await Service.findById(serviceId);
                if (!service) {
                    socket.emit('error', { message: 'Service not found' });
                    return;
                }

                // Check if user is the assigned technician
                if (service.assignedTechnician.toString() !== socket.user._id.toString()) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                // Update technician location
                await Technician.findByIdAndUpdate(socket.user._id, {
                    currentLocation: location
                });

                // Update tracking information
                const tracking = await Tracking.findOne({ service: serviceId });
                if (tracking) {
                    tracking.location = location;
                    await tracking.save();
                }

                // Emit location update to service room
                io.to(`service:${serviceId}`).emit('location:update', {
                    location,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Location update error:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Update service status
        socket.on('status:update', async (data) => {
            try {
                const { serviceId, status } = data;
                const service = await Service.findById(serviceId);
                if (!service) {
                    socket.emit('error', { message: 'Service not found' });
                    return;
                }

                // Check if user is the assigned technician
                if (service.assignedTechnician.toString() !== socket.user._id.toString()) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                // Update service status
                service.status = status;
                await service.save();

                // Update tracking status
                const tracking = await Tracking.findOne({ service: serviceId });
                if (tracking) {
                    tracking.status = status;
                    if (status === 'arrived') {
                        tracking.actualArrivalTime = new Date();
                    } else if (status === 'in_progress') {
                        tracking.startTime = new Date();
                    } else if (status === 'completed') {
                        tracking.completionTime = new Date();
                    }
                    await tracking.save();
                }

                // Emit status update to service room
                io.to(`service:${serviceId}`).emit('status:update', {
                    status,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Status update error:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Handle technician updates
        socket.on('technician:update', async (data) => {
            try {
                const { serviceId, estimatedArrivalTime, notes } = data;
                const service = await Service.findById(serviceId);
                if (!service) {
                    socket.emit('error', { message: 'Service not found' });
                    return;
                }

                // Check if user is the assigned technician
                if (service.assignedTechnician.toString() !== socket.user._id.toString()) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                // Update tracking information
                const tracking = await Tracking.findOne({ service: serviceId });
                if (tracking) {
                    if (estimatedArrivalTime) {
                        tracking.estimatedArrivalTime = estimatedArrivalTime;
                    }
                    if (notes) {
                        tracking.notes.push({
                            text: notes,
                            timestamp: new Date()
                        });
                    }
                    await tracking.save();

                    // Emit technician update to service room
                    io.to(`service:${serviceId}`).emit('technician:update', {
                        estimatedArrivalTime,
                        notes: notes ? {
                            text: notes,
                            timestamp: new Date()
                        } : null,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error('Technician update error:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
}; 