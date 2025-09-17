// Global variables and mock API
const mockAPI = {
    createService: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            _id: 'mock-service-' + Date.now(),
            status: 'assigned',
            ...data
        };
    },
    getServices: async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Return mock service history if available in localStorage
        const savedServices = localStorage.getItem('roadrescue_services');
        return savedServices ? JSON.parse(savedServices) : [];
    },
    saveService: (service) => {
        // Save to localStorage for persistence
        const savedServices = localStorage.getItem('roadrescue_services');
        const services = savedServices ? JSON.parse(savedServices) : [];
        services.push(service);
        localStorage.setItem('roadrescue_services', JSON.stringify(services));
    }
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
function showServiceDetailsModal(serviceType) {
    // Get service information based on service type
    const serviceInfo = getServiceInfo(serviceType);
    
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
 * Get service information based on service type
 */
function getServiceInfo(serviceType) {
    const serviceData = {
        battery: {
            title: "Battery Service",
            icon: "fas fa-battery-full",
            description: "Our battery service offers quick and reliable solutions for all your vehicle battery needs. Whether you need a jump-start, a battery replacement, or a thorough diagnostic check, our technicians are equipped with all the necessary tools and expertise.",
            features: [
                "24/7 emergency service",
                "On-site battery replacement",
                "Jump-starting service",
                "Battery testing and diagnosis",
                "All battery types and models supported",
                "Quick response time within 30 minutes",
                "90-day warranty on battery replacements"
            ],
            price: 499,
            pricePerKm: 15
        },
        fuel: {
            title: "Fuel Delivery",
            icon: "fas fa-gas-pump",
            description: "Running out of fuel is a common issue that can happen to anyone. Our fuel delivery service ensures you're not stranded when your tank runs empty. We deliver the type of fuel your vehicle needs, directly to your location.",
            features: [
                "Fast delivery within 30 minutes",
                "All fuel types available (petrol, diesel, premium)",
                "Fuel quality guarantee",
                "24/7 availability",
                "Exact amount of fuel you need",
                "Additional engine check if needed",
                "No hidden fees or surcharges"
            ],
            price: 399,
            pricePerKm: 12
        },
        mechanical: {
            title: "Mechanical Help",
            icon: "fas fa-tools",
            description: "Our mobile mechanical service brings the repair shop to you. Our certified mechanics can diagnose and fix a wide range of vehicle issues on the spot, saving you time and the hassle of towing your vehicle to a garage.",
            features: [
                "Certified mechanics with years of experience",
                "On-site diagnostics using advanced tools",
                "Minor repairs executed immediately",
                "Common replacement parts in stock",
                "Transparent pricing with no hidden costs",
                "Detailed report of issues found",
                "Follow-up service recommendations if needed"
            ],
            price: 599,
            pricePerKm: 18
        },
        towing: {
            title: "Towing Service",
            icon: "fas fa-truck",
            description: "When your vehicle can't be repaired on the spot, our professional towing service ensures it's transported safely to your preferred location. We use modern equipment to ensure your vehicle is moved without any additional damage.",
            features: [
                "All vehicle types supported (cars, SUVs, bikes)",
                "Damage-free towing guarantee",
                "Rapid response time",
                "Long-distance towing available",
                "Enclosed transport for premium vehicles",
                "Winching and recovery from difficult locations",
                "Insurance-approved service"
            ],
            price: 699,
            pricePerKm: 25
        },
        lockout: {
            title: "Lockout Service",
            icon: "fas fa-key",
            description: "Being locked out of your vehicle can be frustrating. Our lockout service provides quick access to your vehicle without causing any damage to the locks or doors, using specialized tools and techniques.",
            features: [
                "Damage-free unlocking techniques",
                "Key replacement available",
                "Smart key programming on-site",
                "20-minute average response time",
                "All vehicle makes and models supported",
                "24/7 emergency service",
                "Advanced security bypass methods"
            ],
            price: 449,
            pricePerKm: 15
        },
        tire: {
            title: "Tire Change",
            icon: "fas fa-wrench",
            description: "Flat tires and blowouts can happen unexpectedly. Our tire change service provides quick replacement of your flat tire with your spare, or repair of minor punctures on the spot to get you back on the road quickly.",
            features: [
                "Spare tire installation",
                "Tire repair for minor punctures",
                "New tire delivery option if needed",
                "Tire pressure monitoring",
                "Proper torque application",
                "Balancing check",
                "Future tire health recommendations"
            ],
            price: 499,
            pricePerKm: 15
        },
        accident: {
            title: "Accident Recovery",
            icon: "fas fa-car-crash",
            description: "After an accident, our recovery team provides comprehensive assistance, from recovering your damaged vehicle to helping with insurance procedures and ensuring you have all the documentation you need.",
            features: [
                "Immediate response priority",
                "Vehicle recovery from any location",
                "Insurance coordination assistance",
                "Medical services coordination if needed",
                "Temporary transportation arrangement",
                "Post-accident safety check",
                "Detailed incident documentation"
            ],
            price: 749,
            pricePerKm: 30
        }
    };

    return serviceData[serviceType] || serviceData.battery;
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
function showPaymentModal(serviceType) {
    // Get service information based on service type
    const serviceInfo = getServiceInfo(serviceType);
    
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
                        <span>₹${serviceInfo.price}</span>
                    </div>
                    <div class="summary-item">
                        <span>Distance Fee:</span>
                        <span>₹${serviceInfo.pricePerKm}/km (calculated on completion)</span>
                    </div>
                </div>
                
                <div class="booking-form">
                    <h3>Your Information</h3>
                    <div class="form-group">
                        <label for="user-name">Your Name</label>
                        <input type="text" id="user-name" placeholder="Enter your name" required>
                    </div>
                    <div class="form-group">
                        <label for="user-phone">Phone Number</label>
                        <input type="tel" id="user-phone" placeholder="Enter your phone number" required>
                    </div>
                    <div class="form-group">
                        <label for="user-location">Your Location</label>
                        <input type="text" id="user-location" placeholder="Enter your location" required>
                    </div>
                    <div class="form-group">
                        <label for="vehicle-details">Vehicle Details</label>
                        <textarea id="vehicle-details" placeholder="Make, model, year, etc." required></textarea>
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
            
            // Simulate API call
            setTimeout(() => {
                modal.style.display = 'none';
                
                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'success-message';
                notification.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <div class="message-content">
                        <p>Your ${serviceInfo.title} request has been confirmed!</p>
                        <p>A technician will arrive at your location soon.</p>
                    </div>
                `;
                document.body.appendChild(notification);
                
                // Remove notification after 5 seconds
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 5000);
                
                // Remove modal
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                
                // Redirect to tracking page
                window.location.href = '#tracking';
                
                // Update tracking info
                const technicianName = document.getElementById('technician-name');
                const etaElement = document.getElementById('eta');
                const statusBadge = document.querySelector('.status-badge');
                
                if (technicianName) technicianName.textContent = 'John Smith';
                if (etaElement) etaElement.textContent = '15 minutes';
                if (statusBadge) {
                    statusBadge.textContent = 'On the way';
                    statusBadge.className = 'status-badge active';
                }
            }, 2000);
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

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Make functions globally available
    window.showServiceDetailsModal = showServiceDetailsModal;
    window.showPaymentModal = showPaymentModal;
});