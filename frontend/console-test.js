// Console Test for RoadRescue360 Dynamic Service Tracking
// Copy and paste this code into your browser console on the track-service.html page

function testFuelDelivery() {
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
    console.log('✅ Test fuel data set:', testData);
    
    // Manually update the page elements
    const allDetailValues = document.querySelectorAll('.detail-value');
    console.log('Found', allDetailValues.length, 'detail-value elements');
    
    for (let i = 0; i < allDetailValues.length; i++) {
        const element = allDetailValues[i];
        console.log(`Element ${i}: "${element.textContent.trim()}"`);
        if (element.textContent.trim() === 'Battery Jump Start') {
            console.log('✅ Found Battery Jump Start element, updating to: Fuel Delivery');
            element.textContent = 'Fuel Delivery';
            break;
        }
    }
    
    // Update cost breakdown
    const serviceNameElement = document.getElementById('service-name');
    const servicePriceElement = document.getElementById('service-price');
    
    if (serviceNameElement) {
        console.log('✅ Updating service name to: Fuel Delivery Service');
        serviceNameElement.textContent = 'Fuel Delivery Service';
    }
    
    if (servicePriceElement) {
        console.log('✅ Updating service price to: ₹999.00');
        servicePriceElement.textContent = '₹999.00';
    }
    
    console.log('🎉 Test completed! Check the page for changes.');
}

// Run the test
console.log('🚀 Starting Fuel Delivery Test...');
testFuelDelivery();



