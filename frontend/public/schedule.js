/**
 * Schedule Service Button Functionality for RoadRescue360
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create Schedule Modal
    function createScheduleModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'schedule-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Schedule a Service</h2>
                <form id="schedule-form">
                    <div class="form-group">
                        <label for="schedule-location">Your Location</label>
                        <input type="text" id="schedule-location" placeholder="Enter your location" required>
                        <button type="button" class="secondary-button use-current-location">
                            <i class="fas fa-location-arrow"></i> Use Current Location
                        </button>
                    </div>
                    <div class="form-group">
                        <label for="schedule-service">Service Type</label>
                        <select id="schedule-service" required>
                            <option value="">Select service type</option>
                            <option value="battery">Battery Service</option>
                            <option value="tire">Tire Service</option>
                            <option value="maintenance">Regular Maintenance</option>
                            <option value="inspection">Vehicle Inspection</option>
                            <option value="repair">Repair Service</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="schedule-date">Preferred Date</label>
                        <input type="date" id="schedule-date" required min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="schedule-time">Preferred Time</label>
                        <input type="time" id="schedule-time" required>
                    </div>
                    <div class="form-group">
                        <label for="schedule-name">Your Name</label>
                        <input type="text" id="schedule-name" placeholder="Enter your full name" required>
                    </div>
                    <div class="form-group">
                        <label for="schedule-phone">Phone Number</label>
                        <input type="tel" id="schedule-phone" placeholder="Enter your phone number" required>
                    </div>
                    <div class="form-group">
                        <label for="schedule-notes">Additional Notes</label>
                        <textarea id="schedule-notes" placeholder="Vehicle details, specific requirements, etc."></textarea>
                    </div>
                    <button type="submit" class="submit-button">
                        <i class="fas fa-calendar-check"></i> Schedule Service
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        return modal;
    }

    // Add schedule button functionality
    const scheduleBtn = document.querySelector('.cta-button.secondary');
    
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function() {
            // Get or create modal
            let scheduleModal = document.getElementById('schedule-modal');
            if (!scheduleModal) {
                scheduleModal = createScheduleModal();
            }
            
            // Show modal
            scheduleModal.style.display = 'block';
            
            // Close button functionality
            const closeBtn = scheduleModal.querySelector('.close-modal');
            closeBtn.addEventListener('click', function() {
                scheduleModal.style.display = 'none';
            });
            
            // Click outside to close
            window.addEventListener('click', function(e) {
                if (e.target === scheduleModal) {
                    scheduleModal.style.display = 'none';
                }
            });
            
            // Use current location button
            const useLocationBtn = scheduleModal.querySelector('.use-current-location');
            useLocationBtn.addEventListener('click', function() {
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
                
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const locationInput = document.getElementById('schedule-location');
                            if (locationInput) {
                                locationInput.value = `${position.coords.latitude}, ${position.coords.longitude}`;
                            }
                            this.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                            this.disabled = false;
                        },
                        (error) => {
                            console.error('Geolocation error:', error);
                            alert('Error getting location. Please enter your location manually.');
                            this.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                            this.disabled = false;
                        }
                    );
                } else {
                    alert('Geolocation is not supported by your browser');
                    this.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                    this.disabled = false;
                }
            });
            
            // Form submission
            const scheduleForm = document.getElementById('schedule-form');
            scheduleForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const submitBtn = this.querySelector('.submit-button');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scheduling...';

                try {
                    const locationInput = document.getElementById('schedule-location').value;
                    const serviceType = document.getElementById('schedule-service').value;
                    const notes = document.getElementById('schedule-notes').value;
                    const phone = document.getElementById('schedule-phone').value;
                    const vehicleDetails = { notes, phone };

                    const body = {
                        type: serviceType,  // ✅ ensures correct service type
                        location: {
                            type: "Point",
                            coordinates: locationInput.split(',').map(Number)
                        },
                        address: locationInput,
                        vehicleDetails,
                        description: notes
                    };

                    const response = await fetch('http://localhost:3000/api/services', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token') // if auth is required
                        },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to schedule service');
                    }

                    const data = await response.json();
                    console.log('Service booked:', data);

                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Your service has been scheduled!';
                    document.body.appendChild(successMsg);

                    scheduleForm.reset();
                    scheduleModal.style.display = 'none';

                    setTimeout(() => {
                        document.body.removeChild(successMsg);
                    }, 5000);
                } catch (error) {
                    console.error('Error booking service:', error);
                    alert('Something went wrong while scheduling the service.');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Schedule Service';
                }
            });
        });
    }
    
    console.log('Schedule service functionality initialized');
});