/**
 * Emergency Modal Functionality for RoadRescue360
 * Enhanced version with improved feedback and validation
 */
// Add emergency modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get emergency modal elements
    const emergencyBtn = document.querySelector('.emergency-btn');
    const emergencyModal = document.getElementById('emergency-modal');
    const closeEmergencyModal = document.getElementById('close-emergency-modal');
    const emergencyForm = document.getElementById('emergency-form');
    const useGpsBtn = document.getElementById('use-gps');
    const locationInput = document.getElementById('location');
    
    // Store active request status
    let emergencyRequestActive = false;
    let emergencyRequestId = null;
    
    // Open emergency modal when clicking the emergency button
    if (emergencyBtn && emergencyModal) {
        emergencyBtn.addEventListener('click', function() {
            emergencyModal.style.display = 'flex';
            
            // Add visual focus to first field for better UX
            const firstInput = emergencyModal.querySelector('input');
            if (firstInput) setTimeout(() => firstInput.focus(), 300);
        });
    }
    
    // Close emergency modal when clicking the close button
    if (closeEmergencyModal && emergencyModal) {
        closeEmergencyModal.addEventListener('click', function() {
            // Check if form has data and confirm before closing
            if (hasFormData(emergencyForm)) {
                if (confirm('Are you sure you want to close this form? Your information will be lost.')) {
                    emergencyModal.style.display = 'none';
                }
            } else {
            emergencyModal.style.display = 'none';
            }
        });
    }
    
    // Close emergency modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === emergencyModal) {
            // Check if form has data and confirm before closing
            if (hasFormData(emergencyForm)) {
                if (confirm('Are you sure you want to close this form? Your information will be lost.')) {
                    emergencyModal.style.display = 'none';
                }
            } else {
            emergencyModal.style.display = 'none';
            }
        }
    });
    
    // Use GPS button functionality
    if (useGpsBtn) {
        useGpsBtn.addEventListener('click', function() {
            getLocation();
        });
    }
    
   // Pre-fill emergency form with user data
   function prefillEmergencyForm() {
       if (window.userProfileService && window.userProfileService.isLoggedIn() && window.userProfileService.profileData) {
           const profile = window.userProfileService.profileData;
           
           // Pre-fill phone number
           const phoneField = document.getElementById('phone');
           if (phoneField && profile.phone && !phoneField.value) {
               phoneField.value = profile.phone;
           }
           
           // Pre-fill vehicle info
           const vehicleField = document.getElementById('vehicle-info');
           if (vehicleField && profile.vehicleDetails && !vehicleField.value) {
               vehicleField.value = profile.vehicleDetails;
           }
       }
   }

   // Handle emergency form submission
    if (emergencyForm) {
        // Pre-fill form when it loads
        prefillEmergencyForm();
        
    emergencyForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const isValid = validateEmergencyForm();
        if (!isValid) return;

        const submitBtn = emergencyForm.querySelector(".submit-button");
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
        const data = {
            location: document.getElementById("location").value,
            issue: document.getElementById("issue").value,
            phone: document.getElementById("phone").value,
            vehicleInfo: document.getElementById("vehicle-info").value,
        };

        const headers = { "Content-Type": "application/json" };
        
        // Add authentication if user is logged in
        if (window.userProfileService && window.userProfileService.isLoggedIn()) {
            const authHeaders = window.userProfileService.getAuthHeaders();
            Object.assign(headers, authHeaders);
        }
        
        const res = await fetch(`${BASE_URL}/api/emergency`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorText = await res.text();
            let errorMessage = "Failed to submit SOS request";
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || `HTTP ${res.status}: ${res.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const responseText = await res.text();
        if (!responseText) {
            throw new Error("Empty response from server");
        }

        const result = JSON.parse(responseText);
        transformToStatusView(result.requestId);

        } catch (err) {
        alert("Error: " + err.message);
        } finally {
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send SOS Request';
        submitBtn.disabled = false;
        }
    });
    }
    
    // Helper function to check if form has any data entered
    function hasFormData(form) {
        let hasData = false;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                hasData = true;
            }
        });
        
        return hasData;
    }
    
    // Validate emergency form
    function validateEmergencyForm() {
        let isValid = true;
        
        // Get form fields
        const location = document.getElementById('location').value.trim();
        const issue = document.getElementById('issue').value;
        const phone = document.getElementById('phone').value.trim();
        
        // Clear previous error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
        
        // Validate location
        if (!location) {
            addErrorMessage('location', 'Please enter your location or use GPS');
            isValid = false;
        }
        
        // Validate issue type
        if (!issue) {
            addErrorMessage('issue', 'Please select an issue type');
            isValid = false;
        }
        
        // Validate phone number
        if (!phone) {
            addErrorMessage('phone', 'Please enter your phone number');
            isValid = false;
        } else if (!validatePhoneNumber(phone)) {
            addErrorMessage('phone', 'Please enter a valid phone number');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Helper function to validate phone number
    function validatePhoneNumber(phone) {
        // Basic validation for demonstration - adjust based on your requirements
        const phoneRegex = /^\d{10,15}$/;
        return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
    }
    
    // Helper function to add error message
    function addErrorMessage(inputId, message) {
        const input = document.getElementById(inputId);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        errorMessage.style.color = 'red';
        errorMessage.style.fontSize = '0.8rem';
        errorMessage.style.marginTop = '5px';
        
        // Add error class to input
        input.classList.add('error');
        
        // Add error message after input
        input.parentNode.appendChild(errorMessage);
        
        // Remove error when input changes
        input.addEventListener('input', function() {
            input.classList.remove('error');
            const error = input.parentNode.querySelector('.error-message');
            if (error) {
                error.remove();
            }
        });
    }
    
    // Transform form to status view
    function transformToStatusView(requestId) {
        const modalContent = document.querySelector('.modal-content');
        const formHTML = modalContent.innerHTML;
        
        // Store form HTML in a data attribute for possible restoration
        modalContent.setAttribute('data-form-html', formHTML);
        
        // Get form data
        const location = document.getElementById('location').value;
        const issue = document.getElementById('issue').options[document.getElementById('issue').selectedIndex].text;
        const phone = document.getElementById('phone').value;
        const vehicleInfo = document.getElementById('vehicle-info').value || 'Not provided';
        
        // Calculate estimated arrival time (random between 10-30 minutes)
        const eta = Math.floor(Math.random() * 20) + 10;
        
        // Create status view HTML
        const statusHTML = `
            <span class="close-modal" id="close-emergency-modal">&times;</span>
            <h2>Emergency Request Submitted</h2>
            <div class="request-status">
                <div class="request-id">
                    <strong>Request ID:</strong> ${requestId}
                </div>
                <div class="status-badge active">
                    Technician is being assigned
                </div>
                <div class="request-details">
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-tools"></i>
                        <span>${issue}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <span>${phone}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-car"></i>
                        <span>${vehicleInfo}</span>
                    </div>
                </div>
                <div class="eta-container">
                    <h3>Estimated Arrival</h3>
                    <div class="eta-time">
                        <i class="fas fa-clock"></i>
                        <span id="eta-minutes">${eta}</span> minutes
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: 5%;"></div>
                    </div>
                </div>
                <div class="emergency-actions">
                    <button class="secondary-button" id="cancel-request">
                        <i class="fas fa-times"></i> Cancel Request
                    </button>
                    <button class="submit-button" id="view-tracking">
                        <i class="fas fa-map-marked-alt"></i> View on Map
                    </button>
                </div>
            </div>
        `;
        
        // Update modal content
        modalContent.innerHTML = statusHTML;
        
        // Start countdown
        startEtaCountdown(eta);
        
        // Add event listener to close button
        const closeButton = document.getElementById('close-emergency-modal');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                emergencyModal.style.display = 'none';
            });
        }
        
        // Add event listener to cancel button
        const cancelButton = document.getElementById('cancel-request');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                if (confirm('Are you sure you want to cancel this emergency request?')) {
                    alert('Emergency request cancelled');
                    // Restore original form
                    restoreEmergencyForm();
                    // Hide modal
                    emergencyModal.style.display = 'none';
                }
            });
        }
        
        // Add event listener to view tracking button
        const viewTrackingButton = document.getElementById('view-tracking');
        if (viewTrackingButton) {
            viewTrackingButton.addEventListener('click', function() {
                // Close modal
                emergencyModal.style.display = 'none';
                // Scroll to tracking section
                document.querySelector('#tracking').scrollIntoView({ 
                    behavior: 'smooth' 
                });
                // Simulate technician assignment
                simulateTechnicianAssignment();
            });
        }
    }
    
    // Start ETA countdown
    function startEtaCountdown(eta) {
        let minutes = eta;
        const etaElement = document.getElementById('eta-minutes');
        const progressBar = document.querySelector('.progress');
        
        // Calculate progress increment for each minute
        const progressIncrement = 95 / minutes; // Start at 5%, end at 100%
        let currentProgress = 5;
        
        const countdownInterval = setInterval(() => {
            minutes--;
            if (minutes <= 0) {
                clearInterval(countdownInterval);
                // Update UI when technician arrives
                if (etaElement) etaElement.textContent = '0';
                if (progressBar) progressBar.style.width = '100%';
                
                const statusBadge = document.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Technician has arrived';
                    statusBadge.classList.remove('active');
                    statusBadge.classList.add('success');
                }
            } else {
                if (etaElement) etaElement.textContent = minutes;
                currentProgress += progressIncrement;
                if (progressBar) progressBar.style.width = `${currentProgress}%`;
            }
        }, 60000); // Update every minute
        
        // Store interval ID to clear it if needed
        window.emergencyCountdown = countdownInterval;
    }
    
    // Restore emergency form
    function restoreEmergencyForm() {
        const modalContent = document.querySelector('.modal-content');
        const formHTML = modalContent.getAttribute('data-form-html');
        
        if (formHTML) {
            modalContent.innerHTML = formHTML;
            
            // Re-attach event listeners
            const closeButton = document.getElementById('close-emergency-modal');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    emergencyModal.style.display = 'none';
                });
            }
            
    const useGpsBtn = document.getElementById('use-gps');
    if (useGpsBtn) {
        useGpsBtn.addEventListener('click', function() {
                    getLocation();
                });
            }
            
            const emergencyForm = document.getElementById('emergency-form');
            if (emergencyForm) {
                emergencyForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // Rest of the submission logic
                    // (This is simplified - you would re-implement the submission logic)
                });
            }
        }
        
        // Clear countdown if it exists
        if (window.emergencyCountdown) {
            clearInterval(window.emergencyCountdown);
        }
    }
    
    // Simulate technician assignment in tracking section
    function simulateTechnicianAssignment() {
        // Update technician name with dynamic data
        const technicianName = document.getElementById('technician-name');
        if (technicianName) {
            if (window.technicianService) {
                technicianName.textContent = window.technicianService.getRandomTechnicianName();
            } else {
                technicianName.textContent = 'Technician';
            }
        }
        
        // Update ETA
        const eta = document.getElementById('eta');
        if (eta) {
            eta.textContent = '15 minutes';
        }
        
        // Update status
        const statusBadge = document.querySelector('#track-technician .status-badge');
        if (statusBadge) {
            statusBadge.textContent = 'En route to your location';
            statusBadge.className = 'status-badge active';
        }
        
        // Ensure correct tab is active
        const technicianTab = document.querySelector('[data-tab="track-technician"]');
        if (technicianTab) {
            technicianTab.click();
        }
    }
    
    // Get user's location
    function getLocation() {
        const useGpsBtn = document.getElementById('use-gps');
        const locationInput = document.getElementById('location');
        
        // Disable button and show loading indicator
        if (useGpsBtn) {
            useGpsBtn.disabled = true;
            useGpsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
        }
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                function(position) {
                    // Success - update location input
                        if (locationInput) {
                        locationInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
                        
                        // Try to get a readable address using a geocoding service
                        // This would typically use a service like Google's Geocoding API
                        // For demonstration, we'll just use the coordinates
                        
                        // Clear any previous error
                        locationInput.classList.remove('error');
                        const errorMessage = locationInput.parentNode.querySelector('.error-message');
                        if (errorMessage) {
                            errorMessage.remove();
                        }
                    }
                    
                    // Reset button
                    if (useGpsBtn) {
                        useGpsBtn.disabled = false;
                        useGpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
                    }
                },
                function(error) {
                    // Error handling
                    let errorMessage = '';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access was denied. Please enter your location manually.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable. Please try again or enter manually.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'The request to get your location timed out. Please try again.';
                            break;
                        case error.UNKNOWN_ERROR:
                            errorMessage = 'An unknown error occurred. Please enter your location manually.';
                            break;
                    }
                    
                    // Show error alert
                    alert(errorMessage);
                    
                    // Reset button
                    if (useGpsBtn) {
                        useGpsBtn.disabled = false;
                        useGpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
                    }
                },
                { maximumAge: 60000, timeout: 10000, enableHighAccuracy: true }
                );
            } else {
            // Geolocation not supported
            alert('Geolocation is not supported by your browser. Please enter your location manually.');
            
            // Reset button
            if (useGpsBtn) {
                useGpsBtn.disabled = false;
                useGpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
            }
        }
    }
    
    console.log('Enhanced emergency functionality initialized');
});
