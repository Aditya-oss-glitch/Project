/**
 * Pricing Service for RoadRescue360
 * Handles dynamic pricing calculations
 */

class PricingService {
    constructor() {
        this.basePrices = {
            battery: 499,
            fuel: 399,
            mechanical: 599,
            towing: 699,
            lockout: 449,
            tire: 499,
            accident: 749,
            emergency: 999
        };
        
        this.pricePerKm = {
            battery: 15,
            fuel: 12,
            mechanical: 18,
            towing: 25,
            lockout: 15,
            tire: 15,
            accident: 30,
            emergency: 35
        };
    }

    /**
     * Get pricing from backend API
     */
    async getPricingFromAPI() {
        try {
            const response = await fetch(`${BASE_URL}/api/pricing`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch pricing data');
            }
            
            const data = await response.text();
            if (!data) {
                throw new Error('Empty response from server');
            }
            
            const pricing = JSON.parse(data);
            return pricing;
        } catch (error) {
            console.error('Error fetching pricing data:', error);
            throw error;
        }
    }


    /**
     * Calculate total price for a service
     */
    calculatePrice(serviceType, distance = 0, additionalCharges = 0) {
        const basePrice = this.basePrices[serviceType] || this.basePrices.mechanical;
        const kmPrice = (this.pricePerKm[serviceType] || this.pricePerKm.mechanical) * distance;
        const total = basePrice + kmPrice + additionalCharges;
        
        return {
            basePrice,
            distancePrice: kmPrice,
            additionalCharges,
            total: Math.round(total),
            breakdown: {
                service: serviceType,
                baseFee: basePrice,
                distanceFee: kmPrice,
                distance: distance,
                additional: additionalCharges,
                total: Math.round(total)
            }
        };
    }

    /**
     * Format price for display
     */
    formatPrice(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Get service information with dynamic pricing
     */
    async getServiceInfo(serviceType) {
        const pricing = await this.getPricingFromAPI();
        const basePrice = pricing.services[serviceType] || this.basePrices[serviceType] || 499;
        const kmPrice = pricing.pricePerKm[serviceType] || this.pricePerKm[serviceType] || 15;
        
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
                price: basePrice,
                pricePerKm: kmPrice
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
                price: basePrice,
                pricePerKm: kmPrice
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
                price: basePrice,
                pricePerKm: kmPrice
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
                price: basePrice,
                pricePerKm: kmPrice
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
                price: basePrice,
                pricePerKm: kmPrice
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
                price: basePrice,
                pricePerKm: kmPrice
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
                price: basePrice,
                pricePerKm: kmPrice
            }
        };

        return serviceData[serviceType] || serviceData.mechanical;
    }

    /**
     * Initialize pricing service
     */
    async initialize() {
        try {
            const pricing = await this.getPricingFromAPI();
            this.basePrices = pricing.services;
            this.pricePerKm = pricing.pricePerKm;
            console.log('Pricing service initialized with live data');
        } catch (error) {
            console.warn('Pricing service initialized with fallback data');
        }
    }
}

// Create global instance
window.pricingService = new PricingService();
