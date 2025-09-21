/**
 * RoadRescue360 - Combined Booking Functionality
 * This script combines the "Book Now" button functionality with a service booking popup
 */
window.addEventListener('DOMContentLoaded', function() {
    // Create booking modal HTML
    function createBookingModal() {
        const modal = document.createElement('div');
        modal.className = 'booking-modal';
        modal.id = 'booking-modal';
        modal.innerHTML = `
            <div class="booking-content">
                <button class="close-modal">&times;</button>
                <div class="booking-header">
                    <h2>Book Your Service</h2>
                    <p>Please provide your details to book this service</p>
                </div>
                <div class="service-summary">
                    <div class="summary-title">Service Details</div>
                    <div class="summary-item">
                        <span>Service Type:</span>
                        <span id="booking-service-type">-</span>
                    </div>
                    <div class="summary-item">
                        <span>Base Price:</span>
                        <span id="booking-base-price">-</span>
                    </div>
                </div>
                <form id="booking-form" class="booking-form">
                    <div class="form-group">
                        <label for="pickup-location-modal">Your Location</label>
                        <div class="location-input-container">
                            <input type="text" id="pickup-location-modal" placeholder="Enter your location" required>
                            <button type="button" class="location-btn">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="phone-number-modal">Phone Number</label>
                        <input type="tel" id="phone-number-modal" placeholder="Enter your phone number" required>
                    </div>
                    <div class="form-group">
                        <label for="vehicle-details-modal">Vehicle Details</label>
                        <textarea id="vehicle-details-modal" placeholder="Make, model, year, color, etc."></textarea>
                    </div>
                    <button type="submit" class="submit-button">
                        <i class="fas fa-check-circle"></i> Confirm Booking
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        
        // Close on click outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Get location button
        const locationBtn = modal.querySelector('.location-btn');
        locationBtn.addEventListener('click', () => {
            locationBtn.disabled = true;
            locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const locationInput = document.getElementById('pickup-location-modal');
                        const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
                        locationInput.value = coords;
                        
                        locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                        locationBtn.disabled = false;
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        alert('Error getting location. Please enter your location manually.');
                        locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                        locationBtn.disabled = false;
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser');
                locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                locationBtn.disabled = false;
            }
        });
        
        // Form submission
        const form = modal.querySelector('#booking-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.submit-button');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            try {
                const location = document.getElementById('pickup-location-modal').value;
                const phone = document.getElementById('phone-number-modal').value;
                const vehicleDetails = document.getElementById('vehicle-details-modal').value;
                const serviceType = document.getElementById('booking-service-type').textContent;
                const servicePrice = document.getElementById('booking-base-price').textContent;
                
                if (!location || !phone) {
                    throw new Error('Please fill in all required fields');
                }
                
                // Calculate estimated arrival time based on distance
                let distance = 5; // Default 5km
                let eta = '15 minutes'; // Default ETA
                
                // Try to parse coordinates from location
                const coordsMatch = location.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
                if (coordsMatch) {
                    const lat1 = parseFloat(coordsMatch[1]);
                    const lon1 = parseFloat(coordsMatch[3]);
                    
                    // Fixed service center coordinates (New York City)
                    const lat2 = 40.7128;
                    const lon2 = -74.0060;
                    
                    // Calculate distance using Haversine formula
                    const R = 6371; // Radius of the earth in km
                    const dLat = deg2rad(lat2 - lat1);
                    const dLon = deg2rad(lon2 - lon1);
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    distance = R * c; // Distance in km
                    
                    // Calculate ETA (assuming 2 minutes per km)
                    const etaMinutes = Math.round(distance * 2);
                    eta = `${etaMinutes} minutes`;
                }
                
                // Calculate service price details
                const priceText = servicePrice.replace('₹', '');
                const basePrice = parseFloat(priceText);
                
                // Limit distance for demo purposes to avoid huge costs
                const calculatedDistance = Math.min(distance, 15);
                
                // Much lower delivery fee for demo
                const deliveryFee = Math.min(parseFloat((calculatedDistance * 2).toFixed(0)), 50); // Max ₹50 delivery
                
                const subtotal = basePrice + deliveryFee;
                const gst = parseFloat((subtotal * 0.18).toFixed(0)); // 18% GST in India
                const isTowingService = serviceType === 'Towing Service' || serviceType.toLowerCase().includes('towing');
                const tollFee = isTowingService ? 30 : 15; // Lower toll fees for demo
                const total = parseFloat((subtotal + gst + tollFee).toFixed(0));
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Close modal and reset form
                modal.style.display = 'none';
                form.reset();
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i> 
                    Booking confirmed! Redirecting to tracking...
                `;
                document.body.appendChild(successMessage);
                
                // Navigate to tracking tab and update information
                setTimeout(() => {
                    // Access tracking section and scroll to it
                    const trackingSection = document.getElementById('tracking');
                    if (trackingSection) {
                        trackingSection.scrollIntoView({ behavior: 'smooth' });
                        
                        // Ensure track-technician tab is active (it should be by default now)
                        const trackingTab = document.querySelector('[data-tab="track-technician"]');
                        if (trackingTab && !trackingTab.classList.contains('active')) {
                            trackingTab.click();
                        }
                        
                        // Update technician info
                        const technicianName = document.getElementById('technician-name');
                        const etaElement = document.getElementById('eta');
                        const statusBadge = document.querySelector('.status-badge');
                        
                        if (technicianName) {
                            if (window.technicianService) {
                                technicianName.textContent = window.technicianService.getRandomTechnicianName();
                            } else {
                                technicianName.textContent = 'Technician';
                            }
                        }
                        if (etaElement) etaElement.textContent = eta;
                        if (statusBadge) {
                            statusBadge.textContent = 'On the way';
                            statusBadge.className = 'status-badge on-way';
                        }
                        
                        // Create or update payment summary
                        let paymentSummary = document.getElementById('payment-summary');
                        if (!paymentSummary) {
                            paymentSummary = document.createElement('div');
                            paymentSummary.id = 'payment-summary';
                            paymentSummary.className = 'payment-summary tracking-info';
                            
                            const trackingInfo = document.querySelector('.tracking-info');
                            if (trackingInfo && trackingInfo.parentNode) {
                                trackingInfo.parentNode.insertBefore(paymentSummary, trackingInfo.nextSibling);
                            }
                        }
                        
                        paymentSummary.innerHTML = `
                            <h3>Payment Details</h3>
                            <div class="summary-items">
                                <div class="summary-item">
                                    <span>Service Type:</span>
                                    <span>${serviceType}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Base Price:</span>
                                    <span>₹${basePrice.toFixed(0)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Delivery Fee (${calculatedDistance.toFixed(1)} km):</span>
                                    <span>₹${deliveryFee.toFixed(0)}</span>
                                </div>
                                <div class="summary-item subtotal">
                                    <span>Subtotal:</span>
                                    <span>₹${subtotal.toFixed(0)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>GST (18%):</span>
                                    <span>₹${gst.toFixed(0)}</span>
                                </div>
                                <div class="summary-item">
                                    <span>Toll Fee:</span>
                                    <span>₹${tollFee.toFixed(0)}</span>
                                </div>
                                <div class="summary-item total">
                                    <span>Total:</span>
                                    <span>₹${total.toFixed(0)}</span>
                                </div>
                                <div class="payment-note">
                                    <i class="fas fa-info-circle"></i> Payment will be collected upon service completion
                                </div>
                            </div>
                        `;
                        
                        // Initialize or update the map with technician location
                        const initMap = function() {
                            // Get the map container
                            const mapContainer = document.getElementById('tracking-map');
                            if (!mapContainer || !coordsMatch) return;
                            
                            // Parse coordinates
                            const userLat = parseFloat(coordsMatch[1]);
                            const userLng = parseFloat(coordsMatch[3]);
                            
                            // Initialize map if not already initialized
                            if (!window.map) {
                                window.map = new google.maps.Map(mapContainer, {
                                    center: { lat: userLat, lng: userLng },
                                    zoom: 13,
                                    styles: [
                                        { 
                                            "featureType": "poi", 
                                            "elementType": "labels", 
                                            "stylers": [{"visibility": "off"}] 
                                        }
                                    ]
                                });
                            } else {
                                window.map.setCenter({ lat: userLat, lng: userLng });
                            }
                            
                            // Add user marker
                            if (window.userMarker) window.userMarker.setMap(null);
                            window.userMarker = new google.maps.Marker({
                                position: { lat: userLat, lng: userLng },
                                map: window.map,
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: '#007bff',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 2
                                }
                            });
                            
                            // Add technician marker at a nearby location
                            if (window.technicianMarker) window.technicianMarker.setMap(null);
                            window.technicianMarker = new google.maps.Marker({
                                position: { 
                                    lat: userLat + (Math.random() * 0.01), 
                                    lng: userLng + (Math.random() * 0.01) 
                                },
                                map: window.map,
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: '#28a745',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 2
                                }
                            });
                            
                            // Add a line connecting the markers
                            if (window.routeLine) window.routeLine.setMap(null);
                            window.routeLine = new google.maps.Polyline({
                                path: [
                                    { lat: userLat, lng: userLng },
                                    window.technicianMarker.getPosition()
                                ],
                                geodesic: true,
                                strokeColor: '#3771e0',
                                strokeOpacity: 0.8,
                                strokeWeight: 3
                            });
                            window.routeLine.setMap(window.map);
                        };
                        
                        // Initialize map 
                        if (typeof google !== 'undefined' && google.maps) {
                            initMap();
                        } else {
                            // If Google Maps API is not loaded yet, wait and try again
                            const checkGoogleMaps = setInterval(() => {
                                if (typeof google !== 'undefined' && google.maps) {
                                    clearInterval(checkGoogleMaps);
                                    initMap();
                                }
                            }, 500);
                        }
                    }
                    
                    // Remove success message
                    successMessage.remove();
                }, 1500);
                
            } catch (error) {
                alert(error.message || 'Error booking service. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';
            }
        });
        
        return modal;
    }
    
    // Helper function for distance calculation
    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    

    // Add Book Now buttons to all service items
    function addBookNowButtons() {
        // Define prices for each service type (in Indian Rupees)
        const servicePrices = {
            'Battery Service': 499,
            'Fuel Delivery': 399,
            'Mechanical Help': 599,
            'Towing Service': 699,
            'Lockout Service': 449,
            'Tire Change': 499,
            'Mobile Repairs': 649,
            'Accident Recovery': 749
        };

        // Get all service items
        const serviceItems = document.querySelectorAll('.service-item');
        
        // Add price and Book Now button to each service item
        serviceItems.forEach(item => {
            // Get service title
            const title = item.querySelector('h3').textContent;
            const price = servicePrices[title] || 499;
            
            // Add price display if it doesn't exist
            if (!item.querySelector('.service-price')) {
                const priceElement = document.createElement('div');
                priceElement.className = 'service-price';
                priceElement.textContent = `₹${price.toFixed(0)}`;
                
                // Add after paragraph
                const paragraph = item.querySelector('p');
                if (paragraph) {
                    paragraph.after(priceElement);
                } else {
                    item.appendChild(priceElement);
                }
            }
            
            // Add action buttons if they don't exist
            if (!item.querySelector('.service-actions')) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'service-actions';
                
                // Get existing Learn More link
                const existingLink = item.querySelector('.service-link');
                let linkHtml = '';
                
                if (existingLink) {
                    // Remove it from its current position
                    existingLink.remove();
                    
                    // Save its HTML for the new container
                    linkHtml = `
                        <a href="${existingLink.getAttribute('href')}" class="service-link">
                            Learn More
                        </a>
                    `;
                }
                
                // Add only the Learn More link
                actionsDiv.innerHTML = linkHtml;
                
                // Add buttons to the service item
                item.appendChild(actionsDiv);
            }
        });
    }
    
    // Run the function to add Book Now buttons
    addBookNowButtons();

    console.log('Combined booking functionality activated: "Book Now" buttons now open a booking popup');
}); 

/**
 * Enhanced Payment and Booking Functionality for RoadRescue360
 */
document.addEventListener('DOMContentLoaded', function() {
    // Service pricing data
    const servicePricing = {
        battery: { basePrice: 75, perKm: 2 },
        towing: { basePrice: 120, perKm: 3 },
        fuel: { basePrice: 60, perKm: 2 },
        tire: { basePrice: 90, perKm: 2 },
        lockout: { basePrice: 80, perKm: 2 },
        mechanical: { basePrice: 110, perKm: 2.5 },
        accident: { basePrice: 150, perKm: 3.5 },
        other: { basePrice: 100, perKm: 2.5 }
    };
    
    // Card type regex patterns
    const cardPatterns = {
        visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
        mastercard: /^5[1-5][0-9]{14}$/,
        amex: /^3[47][0-9]{13}$/,
        discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
    };
    
    // Wait for DOM to be fully loaded
    let paymentModal = document.querySelector('.payment-modal');
    
    if (!paymentModal) {
        // Create the payment modal structure
        paymentModal = document.createElement('div');
        paymentModal.classList.add('modal', 'payment-modal');
        paymentModal.style.display = 'none'; // Hide by default
        
        const paymentContent = document.createElement('div');
        paymentContent.classList.add('modal-content', 'payment-content');
        
        // Payment modal HTML structure
        paymentContent.innerHTML = `
            <span class="close-modal">&times;</span>
            <div class="payment-header">
                <h2>Payment Details</h2>
                <p>Please complete your payment information</p>
            </div>
            <div class="payment-steps">
                <div class="step active" data-step="summary">Service Summary</div>
                <div class="step" data-step="payment">Payment</div>
                <div class="step" data-step="confirmation">Confirmation</div>
            </div>
            <div class="step-content summary-step active">
                <div class="service-summary">
                    <div class="summary-title">Service Details</div>
                    <div class="summary-items">
                        <div class="summary-item">
                            <span>Battery Jump Start Service</span>
                            <span>$75.00</span>
                        </div>
                        <div class="summary-item">
                            <span>Distance Fee (10 km)</span>
                            <span>$20.00</span>
                        </div>
                        <div class="summary-item subtotal">
                            <span>Subtotal</span>
                            <span>$95.00</span>
                        </div>
                        <div class="summary-item">
                            <span>Tax (10%)</span>
                            <span>$9.50</span>
                        </div>
                        <div class="summary-item total">
                            <span>Total</span>
                            <span>$104.50</span>
                        </div>
                    </div>
                </div>
                <div class="payment-methods">
                    <div class="summary-title">Payment Method</div>
                    <div class="method-options">
                        <div class="payment-method active" data-method="card">
                            <i class="fas fa-credit-card"></i> Credit Card
                        </div>
                        <div class="payment-method" data-method="paypal">
                            <i class="fab fa-paypal"></i> PayPal
                        </div>
                        <div class="payment-method" data-method="apple">
                            <i class="fab fa-apple-pay"></i> Apple Pay
                        </div>
                    </div>
                </div>
                <div class="payment-actions">
                    <button class="next-step" data-next="payment">Continue to Payment</button>
                </div>
            </div>
            <div class="step-content payment-step">
                <form id="payment-form" class="payment-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="card-name">Cardholder Name</label>
                            <input type="text" id="card-name" placeholder="Name as appears on card" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="card-number">Card Number</label>
                        <div class="card-input-container">
                            <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" required>
                            <div class="card-icons">
                                <i class="fab fa-cc-visa"></i>
                                <i class="fab fa-cc-mastercard"></i>
                                <i class="fab fa-cc-amex"></i>
                                <i class="fab fa-cc-discover"></i>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="expiry">Expiry Date</label>
                            <input type="text" id="expiry" placeholder="MM/YY" maxlength="5" required>
                        </div>
                        <div class="form-group">
                            <label for="cvv">CVV</label>
                            <input type="text" id="cvv" placeholder="123" maxlength="4" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="billing-zip">Billing Zip Code</label>
                        <input type="text" id="billing-zip" placeholder="12345" required>
                    </div>
                    <div class="payment-actions">
                        <button type="button" class="prev-step" data-prev="summary">Back</button>
                        <button type="submit" class="submit-button">Pay Now $104.50</button>
                    </div>
                </form>
            </div>
            <div class="step-content confirmation-step">
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <h3>Payment Successful!</h3>
                    <p>Your transaction ID: <strong>TXN123456789</strong></p>
                    <p>A receipt has been sent to your email.</p>
                </div>
                <div class="payment-actions">
                    <button class="close-payment-modal">Done</button>
                </div>
            </div>
        `;
        
        paymentModal.appendChild(paymentContent);
        document.body.appendChild(paymentModal);
        
        // Set up the payment modal functionality
        setupPaymentModal(paymentModal);
    } else {
        // Ensure the existing payment modal is configured correctly
        paymentModal.style.display = 'none'; // Hide the modal by default
        setupPaymentModal(paymentModal);
    }
    

    // Ensure all Learn More links with data-action="payment" also work
    function setupServiceLinks() {
        const serviceLinks = document.querySelectorAll('.service-link[data-action="payment"]');
        serviceLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get service type from data attribute
                const serviceType = this.getAttribute('data-service') || 'battery';
                const distance = parseInt(this.getAttribute('data-distance') || '10');
                
                // Update payment summary
                updatePaymentSummary(serviceType, distance);
                
                // Show payment modal
                const paymentModal = document.querySelector('.payment-modal');
                if (paymentModal) {
                    paymentModal.style.display = 'flex';
                }
            });
        });
    }

    // Run setup function when DOM is loaded
    setupServiceLinks();
});

// ... rest of your existing code ... 
                            

                            // Add a line connecting the markers

                            if (window.routeLine) window.routeLine.setMap(null);

                            window.routeLine = new google.maps.Polyline({

                                path: [

                                    { lat: userLat, lng: userLng },

                                    window.technicianMarker.getPosition()

                                ],

                                geodesic: true,

                                strokeColor: '#3771e0',

                                strokeOpacity: 0.8,

                                strokeWeight: 3

                            });

                            window.routeLine.setMap(window.map);

                        };

                        

                        // Initialize map 

                        if (typeof google !== 'undefined' && google.maps) {

                            initMap();

                        } else {

                            // If Google Maps API is not loaded yet, wait and try again

                            const checkGoogleMaps = setInterval(() => {

                                if (typeof google !== 'undefined' && google.maps) {

                                    clearInterval(checkGoogleMaps);

                                    initMap();

                                }

                            }, 500);

                        }

                    }

                    

                    // Remove success message

                    successMessage.remove();

                }, 1500);

                

            } catch (error) {

                alert(error.message || 'Error booking service. Please try again.');

            } finally {

                submitBtn.disabled = false;

                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';

            }

        });

        

        return modal;

    }

    

    // Helper function for distance calculation

    function deg2rad(deg) {

        return deg * (Math.PI/180);

    }

    



    // Add Book Now buttons to all service items

    function addBookNowButtons() {

        // Define prices for each service type (in Indian Rupees)

        const servicePrices = {

            'Battery Service': 499,

            'Fuel Delivery': 399,

            'Mechanical Help': 599,

            'Towing Service': 699,

            'Lockout Service': 449,

            'Tire Change': 499,

            'Mobile Repairs': 649,

            'Accident Recovery': 749

        };



        // Get all service items

        const serviceItems = document.querySelectorAll('.service-item');

        

        // Add price and Book Now button to each service item

        serviceItems.forEach(item => {

            // Get service title

            const title = item.querySelector('h3').textContent;

            const price = servicePrices[title] || 499;

            

            // Add price display if it doesn't exist

            if (!item.querySelector('.service-price')) {

                const priceElement = document.createElement('div');

                priceElement.className = 'service-price';

                priceElement.textContent = `₹${price.toFixed(0)}`;

                

                // Add after paragraph

                const paragraph = item.querySelector('p');

                if (paragraph) {

                    paragraph.after(priceElement);

                } else {

                    item.appendChild(priceElement);

                }

            }

            

            // Add action buttons if they don't exist

            if (!item.querySelector('.service-actions')) {

                const actionsDiv = document.createElement('div');

                actionsDiv.className = 'service-actions';

                

                // Get existing Learn More link

                const existingLink = item.querySelector('.service-link');

                let linkHtml = '';

                

                if (existingLink) {

                    // Remove it from its current position

                    existingLink.remove();

                    

                    // Save its HTML for the new container

                    linkHtml = `

                        <a href="${existingLink.getAttribute('href')}" class="service-link">

                            Learn More

                        </a>

                    `;

                }

                

                // Add only the Learn More link

                actionsDiv.innerHTML = linkHtml;

                

                // Add buttons to the service item

                item.appendChild(actionsDiv);

            }

        });

    }

    

    // Run the function to add Book Now buttons

    addBookNowButtons();



    console.log('Combined booking functionality activated: "Book Now" buttons now open a booking popup');

}); 



/**

 * Enhanced Payment and Booking Functionality for RoadRescue360

 */

document.addEventListener('DOMContentLoaded', function() {

    // Service pricing data

    const servicePricing = {

        battery: { basePrice: 75, perKm: 2 },

        towing: { basePrice: 120, perKm: 3 },

        fuel: { basePrice: 60, perKm: 2 },

        tire: { basePrice: 90, perKm: 2 },

        lockout: { basePrice: 80, perKm: 2 },

        mechanical: { basePrice: 110, perKm: 2.5 },

        accident: { basePrice: 150, perKm: 3.5 },

        other: { basePrice: 100, perKm: 2.5 }

    };

    

    // Card type regex patterns

    const cardPatterns = {

        visa: /^4[0-9]{12}(?:[0-9]{3})?$/,

        mastercard: /^5[1-5][0-9]{14}$/,

        amex: /^3[47][0-9]{13}$/,

        discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/

    };

    

    // Wait for DOM to be fully loaded

    let paymentModal = document.querySelector('.payment-modal');

    

    if (!paymentModal) {

        // Create the payment modal structure

        paymentModal = document.createElement('div');

        paymentModal.classList.add('modal', 'payment-modal');

        paymentModal.style.display = 'none'; // Hide by default

        

        const paymentContent = document.createElement('div');

        paymentContent.classList.add('modal-content', 'payment-content');

        

        // Payment modal HTML structure

        paymentContent.innerHTML = `

            <span class="close-modal">&times;</span>

            <div class="payment-header">

                <h2>Payment Details</h2>

                <p>Please complete your payment information</p>

            </div>

            <div class="payment-steps">

                <div class="step active" data-step="summary">Service Summary</div>

                <div class="step" data-step="payment">Payment</div>

                <div class="step" data-step="confirmation">Confirmation</div>

            </div>

            <div class="step-content summary-step active">

                <div class="service-summary">

                    <div class="summary-title">Service Details</div>

                    <div class="summary-items">

                        <div class="summary-item">

                            <span>Battery Jump Start Service</span>

                            <span>$75.00</span>

                        </div>

                        <div class="summary-item">

                            <span>Distance Fee (10 km)</span>

                            <span>$20.00</span>

                        </div>

                        <div class="summary-item subtotal">

                            <span>Subtotal</span>

                            <span>$95.00</span>

                        </div>

                        <div class="summary-item">

                            <span>Tax (10%)</span>

                            <span>$9.50</span>

                        </div>

                        <div class="summary-item total">

                            <span>Total</span>

                            <span>$104.50</span>

                        </div>

                    </div>

                </div>

                <div class="payment-methods">

                    <div class="summary-title">Payment Method</div>

                    <div class="method-options">

                        <div class="payment-method active" data-method="card">

                            <i class="fas fa-credit-card"></i> Credit Card

                        </div>

                        <div class="payment-method" data-method="paypal">

                            <i class="fab fa-paypal"></i> PayPal

                        </div>

                        <div class="payment-method" data-method="apple">

                            <i class="fab fa-apple-pay"></i> Apple Pay

                        </div>

                    </div>

                </div>

                <div class="payment-actions">

                    <button class="next-step" data-next="payment">Continue to Payment</button>

                </div>

            </div>

            <div class="step-content payment-step">

                <form id="payment-form" class="payment-form">

                    <div class="form-row">

                        <div class="form-group">

                            <label for="card-name">Cardholder Name</label>

                            <input type="text" id="card-name" placeholder="Name as appears on card" required>

                        </div>

                    </div>

                    <div class="form-group">

                        <label for="card-number">Card Number</label>

                        <div class="card-input-container">

                            <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" required>

                            <div class="card-icons">

                                <i class="fab fa-cc-visa"></i>

                                <i class="fab fa-cc-mastercard"></i>

                                <i class="fab fa-cc-amex"></i>

                                <i class="fab fa-cc-discover"></i>

                            </div>

                        </div>

                    </div>

                    <div class="form-row">

                        <div class="form-group">

                            <label for="expiry">Expiry Date</label>

                            <input type="text" id="expiry" placeholder="MM/YY" maxlength="5" required>

                        </div>

                        <div class="form-group">

                            <label for="cvv">CVV</label>

                            <input type="text" id="cvv" placeholder="123" maxlength="4" required>

                        </div>

                    </div>

                    <div class="form-group">

                        <label for="billing-zip">Billing Zip Code</label>

                        <input type="text" id="billing-zip" placeholder="12345" required>

                    </div>

                    <div class="payment-actions">

                        <button type="button" class="prev-step" data-prev="summary">Back</button>

                        <button type="submit" class="submit-button">Pay Now $104.50</button>

                    </div>

                </form>

            </div>

            <div class="step-content confirmation-step">

                <div class="success-message">

                    <i class="fas fa-check-circle"></i>

                    <h3>Payment Successful!</h3>

                    <p>Your transaction ID: <strong>TXN123456789</strong></p>

                    <p>A receipt has been sent to your email.</p>

                </div>

                <div class="payment-actions">

                    <button class="close-payment-modal">Done</button>

                </div>

            </div>

        `;

        

        paymentModal.appendChild(paymentContent);

        document.body.appendChild(paymentModal);

        

        // Set up the payment modal functionality

        setupPaymentModal(paymentModal);

    } else {

        // Ensure the existing payment modal is configured correctly

        paymentModal.style.display = 'none'; // Hide the modal by default

        setupPaymentModal(paymentModal);

    }

    



    // Ensure all Learn More links with data-action="payment" also work

    function setupServiceLinks() {

        const serviceLinks = document.querySelectorAll('.service-link[data-action="payment"]');

        serviceLinks.forEach(link => {

            link.addEventListener('click', function(e) {

                e.preventDefault();

                

                // Get service type from data attribute

                const serviceType = this.getAttribute('data-service') || 'battery';

                const distance = parseInt(this.getAttribute('data-distance') || '10');

                

                // Update payment summary

                updatePaymentSummary(serviceType, distance);

                

                // Show payment modal

                const paymentModal = document.querySelector('.payment-modal');

                if (paymentModal) {

                    paymentModal.style.display = 'flex';

                }

            });

        });

    }



    // Run setup function when DOM is loaded

    setupServiceLinks();

});



// ... rest of your existing code ... 
