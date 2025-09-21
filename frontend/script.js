// Global variables and API helpers
const API = {
  createService: async (data) => {
    try {
      const headers = { "Content-Type": "application/json" };
      
      // Add authentication if user is logged in
      if (window.userProfileService && window.userProfileService.isLoggedIn()) {
        const authHeaders = window.userProfileService.getAuthHeaders();
        Object.assign(headers, authHeaders);
      }
      
      const res = await fetch(`${BASE_URL}/api/services`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to create service";
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
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  getServices: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/services`);
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to fetch services";
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
        return [];
      }
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  createEmergency: async (data) => {
    try {
      const res = await fetch(`${BASE_URL}/api/emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to create emergency request";
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
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  saveService: async (service) => {
    // Save bookings locally as backup
    const savedServices = localStorage.getItem("roadrescue_services");
    const services = savedServices ? JSON.parse(savedServices) : [];
    services.push(service);
    localStorage.setItem("roadrescue_services", JSON.stringify(services));
  },
};
// Cache DOM elements
let map = null;
let userMarker = null;
let technicianMarker = null;
let activeService = null;

// Helper functions
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = type === 'success' ? 'success-message' : 'error-message';
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after timeout
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 4000);
}

function formatPhoneNumber(phoneNumberString) {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumberString;
}

// Initialize map when Google Maps API is loaded
function initializeMap(latitude = 0, longitude = 0) {
    const mapContainer = document.getElementById('tracking-map');
    if (!mapContainer) return;

    map = new google.maps.Map(mapContainer, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [{"visibility": "off"}]
            }
        ]
    });

    // Add user marker
    if (userMarker) userMarker.setMap(null);
    userMarker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#007bff',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        }
    });
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
    });
}

/**
 * Services Section Enhancement
 */
function enhanceServicesSection() {
    // Handle service animations on scroll
    const serviceItems = document.querySelectorAll('.service-item');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };
    
    const serviceObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe each service item
    serviceItems.forEach(item => {
        serviceObserver.observe(item);
        
        // Add staggered delay for animation
        const index = Array.from(serviceItems).indexOf(item);
        item.style.transitionDelay = `${index * 0.1}s`;
    });

    // Add hover effect to service items for better UX
    serviceItems.forEach(item => {
        // Handle mouse events for desktop
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px)';
            const icon = this.querySelector('.service-icon');
            if (icon) icon.style.transform = 'scale(1.15) rotate(5deg)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = '';
            const icon = this.querySelector('.service-icon');
            if (icon) icon.style.transform = '';
        });
    });
}

/**
 * Show Service Details Modal
 */
async function showServiceDetailsModal(serviceType) {
    // Get service information based on service type (now dynamic)
    const serviceInfo = await getServiceInfo(serviceType);
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${serviceInfo.title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="service-details">
                    <div class="service-icon">
                        <i class="${serviceInfo.icon}"></i>
                    </div>
                    <div class="service-info">
                        <p class="service-description">${serviceInfo.description}</p>
                        <div class="service-features">
                            <h3>Key Features</h3>
                            <ul class="feature-list">
                                ${serviceInfo.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="service-pricing">
                            <h3>Pricing</h3>
                            <div class="pricing-table">
                                <div class="price-row">
                                    <span>Base Service Fee</span>
                                    <span>₹${serviceInfo.price}</span>
                                </div>
                                <div class="price-row">
                                    <span>Per Kilometer Charge</span>
                                    <span>₹${serviceInfo.pricePerKm}/km</span>
                                </div>
                                <p class="price-note">* Final price may vary based on distance and specific service requirements</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-primary book-now" data-service="${serviceType}">Book Now</button>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.style.display = 'flex';
    }, 10);

    // Add event listeners
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
    });

    // Booking button functionality
    const bookNowButton = modal.querySelector('.book-now');
    if (bookNowButton) {
        bookNowButton.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                showPaymentModal(serviceType);
            }, 300);
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        }
    });
}

/**
 * Get service information based on service type (now dynamic)
 */
async function getServiceInfo(serviceType) {
    if (window.pricingService) {
        return await window.pricingService.getServiceInfo(serviceType);
    }
    
    // Fallback if pricing service not available
    return {
        title: serviceType.charAt(0).toUpperCase() + serviceType.slice(1) + " Service",
        icon: "fas fa-tools",
        description: "Professional roadside assistance service",
        features: ["24/7 availability", "Quick response", "Professional service"],
        price: 499,
        pricePerKm: 15
    };
}

/**
 * Improved Payment Modal Handling
 */
function enhancePaymentButtons() {
    // Connect all payment buttons to the modal
    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // This will be handled by the onclick attribute directly
            // Just ensure the button has proper hover animation
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 300);
        });
    });
    
    // Enhance service links with data-action="payment"
    const serviceLinks = document.querySelectorAll('.service-link[data-action="payment"]');
    serviceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get closest service item
            const serviceItem = this.closest('.service-item');
            if (!serviceItem) return;
            
            // Get service type from data attribute
            const serviceType = this.getAttribute('data-service') || 'battery';
            
            // Get title and price from service item
            const title = serviceItem.querySelector('h3').textContent;
            const priceEl = serviceItem.querySelector('.service-price');
            const price = priceEl ? parseInt(priceEl.textContent.replace('₹', '')) : 499;
            
            // Call the showPaymentModal function
            showPaymentModal(title, price);
        });
    });
}

/**
 * Show Payment Modal
 */
async function showPaymentModal(serviceType) {
    // Get service information based on service type (now dynamic)
    const serviceInfo = await getServiceInfo(serviceType);
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Book ${serviceInfo.title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="service-summary">
                    <h3>Service Summary</h3>
                    <div class="summary-item">
                        <span>Service:</span>
                        <span>${serviceInfo.title}</span>
                    </div>
                    <div class="summary-item">
                        <span>Base Fee:</span>
                        <span>${window.pricingService ? window.pricingService.formatPrice(serviceInfo.price) : '₹' + serviceInfo.price}</span>
                    </div>
                    <div class="summary-item">
                        <span>Distance Fee:</span>
                        <span>${window.pricingService ? window.pricingService.formatPrice(serviceInfo.pricePerKm) : '₹' + serviceInfo.pricePerKm}/km (calculated on completion)</span>
                    </div>
                </div>
                
                <div class="booking-form">
                    <h3>Service Details</h3>
                    <div class="form-group">
                        <label for="user-location">Service Location</label>
                        <input type="text" id="user-location" placeholder="Enter service location" required>
                        <button type="button" class="secondary-button use-current-location" onclick="useCurrentLocation()">
                            <i class="fas fa-location-arrow"></i> Use Current Location
                        </button>
                    </div>
                    <div class="form-group">
                        <label for="vehicle-details">Vehicle Details</label>
                        <textarea id="vehicle-details" placeholder="Make, model, year, license plate, etc." required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="service-description">Service Description</label>
                        <textarea id="service-description" placeholder="Describe the issue or service needed"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary submit-booking">Confirm Booking</button>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.style.display = 'flex';
    }, 10);

    // Add event listeners
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        });
    });

    // Pre-fill form with user data if logged in
    if (window.userProfileService && window.userProfileService.isLoggedIn() && window.userProfileService.profileData) {
        setTimeout(() => {
            const profile = window.userProfileService.profileData;
            
            // Pre-fill name fields
            const nameFields = modal.querySelectorAll('input[id*="name"], input[id*="Name"]');
            nameFields.forEach(field => {
                if (profile.name && !field.value) field.value = profile.name;
            });
            
            // Pre-fill phone fields
            const phoneFields = modal.querySelectorAll('input[id*="phone"], input[id*="Phone"]');
            phoneFields.forEach(field => {
                if (profile.phone && !field.value) field.value = profile.phone;
            });
            
            // Pre-fill email fields
            const emailFields = modal.querySelectorAll('input[id*="email"], input[id*="Email"]');
            emailFields.forEach(field => {
                if (profile.email && !field.value) field.value = profile.email;
            });
            
            // Pre-fill location fields
            const locationFields = modal.querySelectorAll('input[id*="location"], input[id*="Location"]');
            locationFields.forEach(field => {
                if (profile.address && !field.value) field.value = profile.address;
            });
            
            // Pre-fill vehicle fields
            const vehicleFields = modal.querySelectorAll('textarea[id*="vehicle"], input[id*="vehicle"]');
            vehicleFields.forEach(field => {
                if (profile.vehicleDetails && !field.value) field.value = profile.vehicleDetails;
            });
        }, 100);
    }

    // Submit booking functionality
    const submitButton = modal.querySelector('.submit-booking');
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const nameInput = modal.querySelector('#user-name');
            const phoneInput = modal.querySelector('#user-phone');
            const locationInput = modal.querySelector('#user-location');
            const vehicleInput = modal.querySelector('#vehicle-details');
            
            // Simple validation
            if (!nameInput.value || !phoneInput.value || !locationInput.value || !vehicleInput.value) {
                alert('Please fill in all fields to continue.');
                return;
            }
            
            // Show loading state
            submitButton.textContent = 'Processing...';
            submitButton.disabled = true;
            
        // Get current location dynamically
        let location = null;
        try {
            if (window.locationService) {
                const currentLocation = await window.locationService.getCurrentLocation();
                location = window.locationService.formatLocationForAPI(currentLocation);
            } else {
                throw new Error('Location service not available');
            }
        } catch (error) {
            console.error('Could not get current location:', error);
            throw new Error('Location is required for service creation');
        }

            // Get user profile data
            const userProfile = window.userProfileService?.profileData || {};
            
            // Create service request
            const serviceData = {
                type: serviceType,
                contactName: userProfile.name || 'User',
                contactPhone: userProfile.phone || '',
                address: locationInput.value,
                vehicleDetails: vehicleInput.value,
                description: document.getElementById('service-description')?.value || `Service request for ${serviceType}`,
                location: location,
                userId: userProfile.id || null
            };
            
            API.createService(serviceData).then(service => {
                modal.style.display = "none";

                showNotification(`Your ${service.type} service request has been confirmed!`, "success");

                // Store service data for payment after completion
                if (window.paymentService) {
                    window.paymentService.pendingPayments.set(service._id, service);
                }

                // Redirect to tracking page
                window.location.href = "#tracking";

                // Update tracking info with dynamic data
                if (window.technicianService && service.assignedTechnician) {
                    window.technicianService.getTechnicianData(service.assignedTechnician).then(technician => {
                        window.technicianService.updateTechnicianDisplay(technician);
                        
                        // Calculate ETA if we have location data
                        if (service.location && service.location.coordinates) {
                            const distance = window.locationService ? 
                                window.locationService.calculateDistance(
                                    service.location.coordinates[1], // lat
                                    service.location.coordinates[0], // lng
                                    service.location.coordinates[1], // same for now
                                    service.location.coordinates[0]
                                ) : 5; // default 5km
                            
                            const eta = window.technicianService.calculateETA(distance);
                            const etaElement = document.getElementById("eta");
                            if (etaElement) etaElement.textContent = `${eta} minutes`;
                        }
                        
                        const statusBadge = document.querySelector(".status-badge");
                        if (statusBadge) {
                            statusBadge.textContent = window.technicianService.getStatusMessage(service.status);
                            statusBadge.className = "status-badge active";
                        }
                    });
                } else {
                    // Fallback to random technician name
                    const technicianName = document.getElementById("technician-name");
                    const etaElement = document.getElementById("eta");
                    const statusBadge = document.querySelector(".status-badge");

                    if (technicianName) technicianName.textContent = window.technicianService ? 
                        window.technicianService.getRandomTechnicianName() : "Technician";
                    if (etaElement) etaElement.textContent = "15 minutes";
                    if (statusBadge) {
                        statusBadge.textContent = "On the way";
                        statusBadge.className = "status-badge active";
                    }
                }
            }).catch(err => {
                console.error(err);
                showNotification("Booking failed. Please try again.", "error");
            }).finally(() => {
                submitButton.textContent = "Confirm Booking";
                submitButton.disabled = false;
            });
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        }
    });
}

// Use current location function
async function useCurrentLocation() {
    try {
        if (window.locationService) {
            const location = await window.locationService.getCurrentLocation();
            const locationInput = document.getElementById('user-location');
            if (locationInput) {
                locationInput.value = location.address || `${location.latitude}, ${location.longitude}`;
            }
        } else {
            alert('Location service not available');
        }
    } catch (error) {
        console.error('Error getting current location:', error);
        alert('Could not get current location. Please enter manually.');
    }
}

// Pre-fill form function
function prefillFormWithUserData(formElement) {
    if (window.userProfileService && window.userProfileService.isLoggedIn() && window.userProfileService.profileData) {
        const profile = window.userProfileService.profileData;
        
        // Pre-fill name fields
        const nameFields = formElement.querySelectorAll('input[id*="name"], input[id*="Name"]');
        nameFields.forEach(field => {
            if (profile.name && !field.value) field.value = profile.name;
        });
        
        // Pre-fill phone fields
        const phoneFields = formElement.querySelectorAll('input[id*="phone"], input[id*="Phone"]');
        phoneFields.forEach(field => {
            if (profile.phone && !field.value) field.value = profile.phone;
        });
        
        // Pre-fill email fields
        const emailFields = formElement.querySelectorAll('input[id*="email"], input[id*="Email"]');
        emailFields.forEach(field => {
            if (profile.email && !field.value) field.value = profile.email;
        });
        
        // Pre-fill location fields
        const locationFields = formElement.querySelectorAll('input[id*="location"], input[id*="Location"]');
        locationFields.forEach(field => {
            if (profile.address && !field.value) field.value = profile.address;
        });
        
        // Pre-fill vehicle fields
        const vehicleFields = formElement.querySelectorAll('textarea[id*="vehicle"], input[id*="vehicle"]');
        vehicleFields.forEach(field => {
            if (profile.vehicleDetails && !field.value) field.value = profile.vehicleDetails;
        });
    }
}

// Initialize services
async function initializeServices() {
    try {
        // Initialize user profile service first
        if (window.userProfileService) {
            await window.userProfileService.initialize();
        }
        
        // Initialize pricing service
        if (window.pricingService) {
            await window.pricingService.initialize();
        }
        
        // Initialize location service
        if (window.locationService) {
            await window.locationService.getCurrentLocation();
        }
        
        // Update city display
        if (window.locationService && window.locationService.currentLocation) {
            const cityElements = document.querySelectorAll('#service-city, #main-office-city');
            cityElements.forEach(el => {
                if (el) el.textContent = window.locationService.currentLocation.city || 'Delhi NCR';
            });
        }
        
        // Pre-fill forms with user data
        if (window.userProfileService && window.userProfileService.isLoggedIn()) {
            // Pre-fill any existing forms
            setTimeout(() => {
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    if (form.id) {
                        window.userProfileService.prefillForm(form.id);
                    }
                });
                
                // Also pre-fill individual input fields
                const nameFields = document.querySelectorAll('input[id*="name"], input[id*="Name"]');
                const phoneFields = document.querySelectorAll('input[id*="phone"], input[id*="Phone"]');
                const emailFields = document.querySelectorAll('input[id*="email"], input[id*="Email"]');
                const locationFields = document.querySelectorAll('input[id*="location"], input[id*="Location"]');
                const vehicleFields = document.querySelectorAll('textarea[id*="vehicle"], input[id*="vehicle"]');
                
                if (window.userProfileService.profileData) {
                    const profile = window.userProfileService.profileData;
                    
                    nameFields.forEach(field => {
                        if (profile.name && !field.value) field.value = profile.name;
                    });
                    
                    phoneFields.forEach(field => {
                        if (profile.phone && !field.value) field.value = profile.phone;
                    });
                    
                    emailFields.forEach(field => {
                        if (profile.email && !field.value) field.value = profile.email;
                    });
                    
                    locationFields.forEach(field => {
                        if (profile.address && !field.value) field.value = profile.address;
                    });
                    
                    vehicleFields.forEach(field => {
                        if (profile.vehicleDetails && !field.value) field.value = profile.vehicleDetails;
                    });
                }
            }, 1000);
        }
        
        // Set up observer to pre-fill dynamically created forms
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's a form or contains forms
                        if (node.tagName === 'FORM' || node.querySelector && node.querySelector('form')) {
                            setTimeout(() => {
                                const forms = node.tagName === 'FORM' ? [node] : node.querySelectorAll('form');
                                forms.forEach(form => {
                                    prefillFormWithUserData(form);
                                });
                            }, 100);
                        }
                    }
                });
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Services initialized successfully');
        
        // Test pre-filling
        setTimeout(() => {
            console.log('Testing pre-filling...');
            console.log('User logged in:', window.userProfileService?.isLoggedIn());
            console.log('Profile data:', window.userProfileService?.profileData);
            
            // Pre-fill any existing forms
            const forms = document.querySelectorAll('form');
            console.log('Found forms:', forms.length);
            forms.forEach(form => {
                prefillFormWithUserData(form);
            });
        }, 2000);
    } catch (error) {
        console.warn('Service initialization failed:', error);
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize services first
    initializeServices();
    // DOM Elements - declare only once
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');
    const serviceItems = document.querySelectorAll('.service-item');
    const contactForm = document.querySelector('.contact-form');
    const emergencyBtn = document.querySelector('.emergency-btn');
    const emergencyForm = document.getElementById('emergency-form');
    const emergencyModal = document.getElementById('emergency-modal');
    const closeModal = document.querySelector('.close-modal');
    const useGpsBtn = document.getElementById('use-gps');
    const trackingTabs = document.querySelectorAll('.tracking-tab');
    const trackingContents = document.querySelectorAll('.tracking-content');
    const trackingForm = document.querySelector('.tracking-form');
    const newsletterForm = document.querySelector('.newsletter-form');

    // Initialize service section enhancements
    enhanceServicesSection();
    
    // Enhance payment buttons
    enhancePaymentButtons();

    // Service item buttons - Direct implementation to ensure it works
    document.querySelectorAll('.service-item .learn-more').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Learn More clicked");
            const serviceItem = this.closest('.service-item');
            if (serviceItem) {
                const serviceType = serviceItem.dataset.service;
                showServiceDetailsModal(serviceType);
            }
        });
    });
    
    document.querySelectorAll('.service-item .book-now').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Book Now clicked");
            const serviceItem = this.closest('.service-item');
            if (serviceItem) {
                const serviceType = serviceItem.dataset.service;
                showPaymentModal(serviceType);
            }
        });
    });

    // Add event listeners for form pre-filling
    document.addEventListener('click', function(e) {
        // Check if clicked element opens a form
        if (e.target.matches('.book-now, .learn-more, .payment-btn, .service-link')) {
            setTimeout(() => {
                // Pre-fill any forms that might have been created
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    prefillFormWithUserData(form);
                });
            }, 500);
        }
    });
    
    // Make functions globally available
    window.showServiceDetailsModal = showServiceDetailsModal;
    window.showPaymentModal = showPaymentModal;
    window.prefillFormWithUserData = prefillFormWithUserData;
    window.useCurrentLocation = useCurrentLocation;
});

// Debug function for testing pre-fill
function testPrefill() {
    console.log('Testing pre-fill functionality...');
    console.log('User Profile Service:', window.userProfileService);
    console.log('Is Logged In:', window.userProfileService?.isLoggedIn());
    console.log('Profile Data:', window.userProfileService?.profileData);
    
    // Test form pre-filling
    const forms = document.querySelectorAll('form');
    console.log('Found forms:', forms.length);
    forms.forEach((form, index) => {
        console.log(`Form ${index}:`, form.id || 'no-id');
        prefillFormWithUserData(form);
    });
    
    // Test individual field pre-filling
    prefillIndividualFields();
    console.log('Pre-fill test completed');
}

// Make testPrefill available globally
window.testPrefill = testPrefill;