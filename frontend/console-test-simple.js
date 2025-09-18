// Simple Console Test for RoadRescue360
// Copy and paste this into your browser console on track-service.html

console.log('🚀 Starting RoadRescue360 Debug Test...');

// Step 1: Set test booking data
const testData = {
    service: 'fuel',
    serviceTitle: 'Fuel Delivery',
    servicePricing: 'Starting at ₹800',
    serviceDescription: 'Emergency fuel delivery service to get you back on the road.',
    serviceIcon: '<i class="fas fa-gas-pump"></i>',
    name: 'John Doe',
    phone: '+91 9876543210',
    location: 'Sector 62, Noida, Uttar Pradesh 201301, India',
    vehicleInfo: 'Honda City - White - DL-01-AB-1234',
    time: 'ASAP',
    paymentMethod: 'Credit Card',
    notes: 'Vehicle is parked in basement parking B2, slot #45',
    timestamp: new Date().toISOString(),
    trackingId: 'RR-' + Math.floor(Math.random() * 1000000)
};

localStorage.setItem('roadRescueBooking', JSON.stringify(testData));
console.log('✅ Test data set:', testData);

// Step 2: Check if elements exist
const allDetailValues = document.querySelectorAll('.detail-value');
console.log('📋 Found', allDetailValues.length, 'detail-value elements');

// Step 3: Update service type
for (let i = 0; i < allDetailValues.length; i++) {
    const element = allDetailValues[i];
    console.log(`Element ${i}: "${element.textContent.trim()}"`);
    if (element.textContent.trim() === 'Battery Jump Start') {
        console.log('✅ Found Battery Jump Start, updating to Fuel Delivery');
        element.textContent = 'Fuel Delivery';
        break;
    }
}

// Step 4: Update cost breakdown
const serviceNameElement = document.getElementById('service-name');
const servicePriceElement = document.getElementById('service-price');

if (serviceNameElement) {
    console.log('✅ Updating service name to: Fuel Delivery Service');
    serviceNameElement.textContent = 'Fuel Delivery Service';
} else {
    console.log('❌ Service name element not found');
}

if (servicePriceElement) {
    console.log('✅ Updating service price to: ₹999.00');
    servicePriceElement.textContent = '₹999.00';
} else {
    console.log('❌ Service price element not found');
}

// Step 5: Update tracking ID
const trackingElement = document.getElementById('displayTrackingId');
if (trackingElement) {
    console.log('✅ Updating tracking ID to:', testData.trackingId);
    trackingElement.textContent = testData.trackingId;
} else {
    console.log('❌ Tracking ID element not found');
}

console.log('🎉 Test completed! Check the page for changes.');
console.log('Expected changes:');
console.log('- Service Type: Battery Jump Start → Fuel Delivery');
console.log('- Service Cost: ₹699.00 → ₹999.00');
console.log('- Service Name: Battery Jump Start Service → Fuel Delivery Service');
console.log('- Tracking ID: Updated to new random ID');



