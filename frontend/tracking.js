/**
 * Tracking functionality for RoadRescue360
 * Enhanced version with realistic technician movement and better user feedback
 */
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const trackingTabs = document.querySelectorAll('.tracking-tab');
    const trackingContents = document.querySelectorAll('.tracking-content');

    // Global variables for tracking
    let technicianMarker = null;
    let userMarker = null;
    let map = null;
    let trackingInterval = null;
    let technicianPosition = null;
    let userPosition = null;
    let eta = 0;
    let etaInterval = null;
    let statusUpdateInterval = null;
    let isServiceActive = false;

    trackingTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active tab
            trackingTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show active content
            trackingContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Calculate distance from coordinates
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const distance = R * c; // Distance in km
        return Math.round(distance * 10) / 10; // Round to 1 decimal
    }
    
    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Initialize Google Map
    function initMap(userLat, userLng) {
        if (!document.getElementById('tracking-map')) return;
        
        // Create map centered on user location
        userPosition = { lat: userLat, lng: userLng };
        map = new google.maps.Map(document.getElementById('tracking-map'), {
            center: userPosition,
            zoom: 14,
            styles: [
                {
                    "featureType": "poi",
                    "elementType": "labels",
                    "stylers": [{"visibility": "off"}]
                }
            ]
        });

        // Add user marker
        userMarker = new google.maps.Marker({
            position: userPosition,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 0.8,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
            },
            title: 'Your Location'
        });

        // Generate random starting point for technician (1-3km away)
        const randomDistance = 1 + Math.random() * 2; // Between 1-3 km
        const randomAngle = Math.random() * 360; // Random direction
        const techLat = userLat + (randomDistance / 111) * Math.cos(randomAngle * (Math.PI/180));
        const techLng = userLng + (randomDistance / (111 * Math.cos(userLat * (Math.PI/180)))) * Math.sin(randomAngle * (Math.PI/180));
        
        technicianPosition = { lat: techLat, lng: techLng };
        
        // Add technician marker
        technicianMarker = new google.maps.Marker({
            position: technicianPosition,
            map: map,
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: '#DB4437',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                rotation: 0
            },
            title: 'Technician'
        });

        // Add path between technician and user
        const pathCoordinates = [
            technicianPosition,
            userPosition
        ];
        
        const path = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#FF6D00',
            strokeOpacity: 0.8,
            strokeWeight: 3
        });
        
        path.setMap(map);
        
        // Calculate initial ETA
        const distance = calculateDistance(techLat, techLng, userLat, userLng);
        eta = Math.round(distance * 3); // Roughly 20km/h (3 minutes per km)
        document.getElementById('eta').textContent = eta + ' minutes';
        
        // Start technician movement simulation
        startTechnicianMovement(path);
        
        // Start ETA updates
        startEtaUpdates();
        
        // Start status updates
        startStatusUpdates();
    }
    
    // Simulate technician movement
    function startTechnicianMovement(path) {
        if (trackingInterval) clearInterval(trackingInterval);
        
        const steps = 100; // Number of steps to complete the journey
        let currentStep = 0;
        
        trackingInterval = setInterval(() => {
            if (currentStep >= steps) {
                clearInterval(trackingInterval);
                
                // Technician arrived
                if (statusUpdateInterval) clearInterval(statusUpdateInterval);
                if (etaInterval) clearInterval(etaInterval);
                
                document.getElementById('eta').textContent = 'Arrived';
                const statusBadge = document.querySelector('.status-badge');
                statusBadge.textContent = 'Service in progress';
                statusBadge.className = 'status-badge success';
                
                // Simulate service completion after some time
                setTimeout(() => {
                    completeService();
                }, 30000); // 30 seconds for demo
                
                return;
            }
            
            // Move technician closer to user
            const newLat = technicianPosition.lat + (userPosition.lat - technicianPosition.lat) / (steps - currentStep) * 0.6;
            const newLng = technicianPosition.lng + (userPosition.lng - technicianPosition.lng) / (steps - currentStep) * 0.6;
            
            technicianPosition = { lat: newLat, lng: newLng };
            technicianMarker.setPosition(technicianPosition);
            
            // Update path
            path.setPath([technicianPosition, userPosition]);
            
            // Calculate rotation/heading
            if (currentStep < steps - 1) {
                const heading = Math.atan2(
                    userPosition.lng - technicianPosition.lng,
                    userPosition.lat - technicianPosition.lat
                ) * 180 / Math.PI;
                
                // Update marker icon with new rotation
                technicianMarker.setIcon({
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 6,
                    fillColor: '#DB4437',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                    rotation: heading
                });
            }
            
            currentStep++;
        }, 600); // Update every 600ms
    }
    
    // Update ETA in real time
    function startEtaUpdates() {
        if (etaInterval) clearInterval(etaInterval);
        
        etaInterval = setInterval(() => {
            if (eta <= 1) {
                clearInterval(etaInterval);
                return;
            }
            
            // Decrease ETA by 1 minute
            eta--;
            document.getElementById('eta').textContent = eta + ' minutes';
        }, 6000); // Update every 6 seconds (in simulation time, 1 minute passes)
    }
    
    // Update status messages periodically
    function startStatusUpdates() {
        if (statusUpdateInterval) clearInterval(statusUpdateInterval);
        
        const statusMessages = [
            'On the way',
            'Technician en route',
            'Approaching your location',
            'Almost there',
            'Arriving soon'
        ];
        
        let messageIndex = 0;
        const statusBadge = document.querySelector('.status-badge');
        
        statusUpdateInterval = setInterval(() => {
            statusBadge.textContent = statusMessages[messageIndex % statusMessages.length];
            messageIndex++;
        }, 12000); // Change status message every 12 seconds
    }

    // Pre-fill tracking form with user data
    function prefillTrackingForm() {
        if (window.userProfileService && window.userProfileService.isLoggedIn() && window.userProfileService.profileData) {
            const profile = window.userProfileService.profileData;
            
            // Pre-fill phone number
            const phoneField = document.getElementById('customer-phone');
            if (phoneField && profile.phone && !phoneField.value) {
                phoneField.value = profile.phone;
            }
            
            // Pre-fill vehicle details
            const vehicleField = document.getElementById('vehicle-details');
            if (vehicleField && profile.vehicleDetails && !vehicleField.value) {
                vehicleField.value = profile.vehicleDetails;
            }
        }
    }

    // Handle form submission
    const trackingForm = document.getElementById('service-request-form');
    
    if (trackingForm) {
        // Pre-fill form when it loads
        prefillTrackingForm();
        
        trackingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get and validate form inputs
            const location = document.getElementById('pickup-location').value;
            const phoneNumber = document.getElementById('customer-phone').value;
            const serviceType = document.getElementById('service-type').value;
            const vehicleDetails = document.getElementById('vehicle-details').value;
            
            if (!location || !phoneNumber || !serviceType || !vehicleDetails) {
                // Improved validation with user feedback
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill in all required fields';
                document.body.appendChild(errorMsg);
                
                setTimeout(() => {
                    document.body.removeChild(errorMsg);
                }, 3000);
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.submit-button');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            
            // Parse coordinates (expected format: "lat, lng")
            let userLat = 40.7128; // Default: NYC
            let userLng = -74.0060;
            let distance = 5; // Default distance in km
            
            try {
                if (location.includes(',')) {
                    [userLat, userLng] = location.split(',').map(coord => parseFloat(coord.trim()));
                    // Use fixed coordinates for service center
                    const serviceCenterLat = 40.7128;
                    const serviceCenterLng = -74.0060;
                    
                    // Calculate actual distance
                    if (!isNaN(userLat) && !isNaN(userLng)) {
                        distance = calculateDistance(userLat, userLng, serviceCenterLat, serviceCenterLng);
                    }
                }
            } catch (error) {
                console.log('Error calculating distance, using default');
            }
            
            // Get current location dynamically
            let locationData = null;
            try {
                if (window.locationService) {
                    const currentLocation = await window.locationService.getCurrentLocation();
                    locationData = window.locationService.formatLocationForAPI(currentLocation);
                } else {
                    // Fallback to coordinates from form
                    locationData = {
                        type: "Point",
                        coordinates: [userLng, userLat] // Note: MongoDB expects [longitude, latitude]
                    };
                }
            } catch (error) {
                console.warn('Could not get current location, using form coordinates:', error);
                locationData = {
                    type: "Point",
                    coordinates: [userLng, userLat]
                };
            }

            // Get user profile data
            const userProfile = window.userProfileService?.profileData || {};
            
            // Create service request via API
            const serviceData = {
                type: serviceType,
                contactName: userProfile.name || 'Customer',
                contactPhone: userProfile.phone || phoneNumber,
                address: location,
                vehicleDetails: vehicleDetails,
                description: `Service request for ${serviceType}`,
                location: locationData,
                userId: userProfile.id || null
            };

            // Call API to create service
            API.createService(serviceData).then(service => {
                // Service created successfully
                completeServiceRequest(userLat, userLng, service);
                
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-search"></i> Find Nearest Technician';
            }).catch(error => {
                console.error('Error creating service:', error);
                
                // Show error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
                document.body.appendChild(errorMsg);
                
                setTimeout(() => {
                    if (document.body.contains(errorMsg)) {
                        document.body.removeChild(errorMsg);
                    }
                }, 5000);
                
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-search"></i> Find Nearest Technician';
            });
            
            // Function to complete service request after payment
            function completeServiceRequest(lat, lng, service = null) {
                isServiceActive = true;
                
                // Switch to tracking tab
                const technicianTab = document.querySelector('[data-tab="track-technician"]');
                if (technicianTab) {
                    technicianTab.click();
                    
                    // Update technician info with dynamic data
                    if (window.technicianService && service && service.assignedTechnician) {
                        window.technicianService.getTechnicianData(service.assignedTechnician).then(technician => {
                            window.technicianService.updateTechnicianDisplay(technician);
                        });
                    } else {
                        // Fallback to random technician name
                        const randomName = window.technicianService ? 
                            window.technicianService.getRandomTechnicianName() : 
                            'Technician';
                        document.getElementById('technician-name').textContent = randomName;
                    }
                    
                    // Initialize tracking map
                    initMap(lat, lng);
                    
                    // Show customer phone
                    if (document.getElementById('customer-phone-display')) {
                        document.getElementById('customer-phone-display').textContent = phoneNumber;
                    }
                    
                    // Add cancel functionality
                    const cancelBtn = document.querySelector('.tracking-actions .cancel');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', function() {
                            if (confirm('Are you sure you want to cancel this service request?')) {
                                // Clean up intervals
                                if (trackingInterval) clearInterval(trackingInterval);
                                if (statusUpdateInterval) clearInterval(statusUpdateInterval);
                                if (etaInterval) clearInterval(etaInterval);
                                
                                isServiceActive = false;
                                
                                // Reset tracking
                                const statusBadge = document.querySelector('.status-badge');
                                statusBadge.textContent = 'Request canceled';
                                statusBadge.className = 'status-badge canceled';
                                
                                document.getElementById('eta').textContent = 'N/A';
                                
                                // Show confirmation message
                                const cancelMsg = document.createElement('div');
                                cancelMsg.className = 'success-message';
                                cancelMsg.innerHTML = '<i class="fas fa-check-circle"></i> Service request has been canceled';
                                document.body.appendChild(cancelMsg);
                                
                                setTimeout(() => {
                                    document.body.removeChild(cancelMsg);
                                }, 5000);
                            }
                        });
                    }
                    
                    // Add message functionality
                    const messageBtn = document.querySelector('.tracking-actions button:nth-child(2)');
                    if (messageBtn) {
                        messageBtn.addEventListener('click', function() {
                            // Create message modal
                            const messageModal = document.createElement('div');
                            messageModal.className = 'modal';
                            messageModal.id = 'message-modal';
                            messageModal.innerHTML = `
                                <div class="modal-content">
                                    <span class="close-modal">&times;</span>
                                    <h2>Message Technician</h2>
                                    <div class="message-container">
                                        <div class="message received">
                                            <div class="message-sender">Technician</div>
                                            <div class="message-content">I'm on my way to your location. Any specific details about your vehicle I should know?</div>
                                            <div class="message-time">Just now</div>
                                        </div>
                                    </div>
                                    <form id="message-form">
                                        <div class="form-group">
                                            <textarea id="message-input" placeholder="Type your message..." required></textarea>
                                        </div>
                                        <button type="submit" class="submit-button"><i class="fas fa-paper-plane"></i> Send</button>
                                    </form>
                                </div>
                            `;
                            
                            document.body.appendChild(messageModal);
                            messageModal.style.display = 'block';
                            
                            // Close modal when clicking X
                            const closeModal = messageModal.querySelector('.close-modal');
                            closeModal.addEventListener('click', () => {
                                document.body.removeChild(messageModal);
                            });
                            
                            // Handle message form
                            const messageForm = document.getElementById('message-form');
                            messageForm.addEventListener('submit', function(e) {
                                e.preventDefault();
                                
                                const messageInput = document.getElementById('message-input');
                                const messageText = messageInput.value.trim();
                                
                                if (!messageText) return;
                                
                                // Add user message
                                const messageContainer = document.querySelector('.message-container');
                                const userMessage = document.createElement('div');
                                userMessage.className = 'message sent';
                                userMessage.innerHTML = `
                                    <div class="message-sender">You</div>
                                    <div class="message-content">${messageText}</div>
                                    <div class="message-time">Just now</div>
                                `;
                                
                                messageContainer.appendChild(userMessage);
                                messageInput.value = '';
                                
                                // Scroll to bottom
                                messageContainer.scrollTop = messageContainer.scrollHeight;
                                
                                // Simulate technician response after 1-3 seconds
                                setTimeout(() => {
                                    const responses = [
                                        "Thanks for the info! I'll be there in a few minutes.",
                                        "Got it! I'm making good progress, see you soon.",
                                        "I understand. I'm bringing the necessary equipment for that issue.",
                                        "Thanks for letting me know. I'll drive carefully to your location."
                                    ];
                                    
                                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                                    
                                    const techResponse = document.createElement('div');
                                    techResponse.className = 'message received';
                                    techResponse.innerHTML = `
                                        <div class="message-sender">Technician</div>
                                        <div class="message-content">${randomResponse}</div>
                                        <div class="message-time">Just now</div>
                                    `;
                                    
                                    messageContainer.appendChild(techResponse);
                                    
                                    // Scroll to bottom
                                    messageContainer.scrollTop = messageContainer.scrollHeight;
                                }, 1000 + Math.random() * 2000);
                            });
                        });
                    }
                }
            }
        });
    }

    // Handle location button
    const locationBtn = document.querySelector('.location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', function() {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const locationInput = document.getElementById('pickup-location');
                        locationInput.value = `${position.coords.latitude}, ${position.coords.longitude}`;
                        this.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                        this.disabled = false;
                        
                        // Show success message for better feedback
                        const successMsg = document.createElement('div');
                        successMsg.className = 'success-message';
                        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Location detected successfully';
                        document.body.appendChild(successMsg);
                        
                        setTimeout(() => {
                            document.body.removeChild(successMsg);
                        }, 3000);
                    },
                    (error) => {
                        // Better error handling with user feedback
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Could not detect location. Please enter manually.';
                        document.body.appendChild(errorMsg);
                        
                        setTimeout(() => {
                            document.body.removeChild(errorMsg);
                        }, 3000);
                        
                        this.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                        this.disabled = false;
                    }
                );
            } else {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Geolocation is not supported by your browser';
                document.body.appendChild(errorMsg);
                
                setTimeout(() => {
                    document.body.removeChild(errorMsg);
                }, 3000);
                
                this.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                this.disabled = false;
            }
        });
    }

    // Style service type select when changed
    const serviceTypeSelect = document.getElementById('service-type');
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', function() {
            if (this.value) {
                this.classList.add('selected');
            } else {
                this.classList.remove('selected');
            }
        });
    }

    // Complete service function
    function completeService() {
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = 'Service Completed';
            statusBadge.className = 'status-badge completed';
        }
        
        // Show completion message
        const completionMsg = document.createElement('div');
        completionMsg.className = 'success-message';
        completionMsg.innerHTML = '<i class="fas fa-check-circle"></i> Service completed successfully!';
        document.body.appendChild(completionMsg);
        
        setTimeout(() => {
            if (document.body.contains(completionMsg)) {
                document.body.removeChild(completionMsg);
            }
        }, 5000);
        
        // Show payment modal if service is in pending payments
        if (window.paymentService && activeService) {
            const serviceId = activeService._id || activeService.id;
            if (window.paymentService.pendingPayments.has(serviceId)) {
                const serviceData = window.paymentService.pendingPayments.get(serviceId);
                window.paymentService.showPaymentModal(serviceId, serviceData);
                window.paymentService.pendingPayments.delete(serviceId);
            }
        }
    }
}); 