/**
 * Location Service for RoadRescue360
 * Handles dynamic location detection and geocoding
 */

class LocationService {
    constructor() {
        this.currentLocation = null;
        this.defaultLocation = {
            latitude: 28.6275,
            longitude: 77.3635,
            city: "Delhi",
            address: "Delhi NCR, India"
        };
    }

    /**
     * Get user's current location using GPS
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    try {
                        // Try to get address from coordinates
                        const address = await this.reverseGeocode(location.latitude, location.longitude);
                        location.address = address;
                        location.city = this.extractCity(address);
                    } catch (error) {
                        console.warn('Could not get address from coordinates:', error);
                        location.address = `${location.latitude}, ${location.longitude}`;
                        location.city = 'Unknown';
                    }
                    
                    this.currentLocation = location;
                    resolve(location);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    // Fallback to default location
                    this.currentLocation = this.defaultLocation;
                    resolve(this.defaultLocation);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    /**
     * Reverse geocode coordinates to get address
     */
    async reverseGeocode(latitude, longitude) {
        try {
            // Using a free geocoding service (you might want to use Google Maps API for production)
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }
            
            const data = await response.json();
            return data.localityInfo?.administrative?.[0]?.name || 
                   data.localityInfo?.locality?.[0]?.name || 
                   `${latitude}, ${longitude}`;
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return `${latitude}, ${longitude}`;
        }
    }

    /**
     * Extract city name from address
     */
    extractCity(address) {
        if (!address) return 'Unknown';
        
        // Try to extract city from common address formats
        const parts = address.split(',');
        if (parts.length > 1) {
            return parts[0].trim();
        }
        return address;
    }

    /**
     * Get location for service requests
     */
    async getLocationForService() {
        if (this.currentLocation) {
            return this.currentLocation;
        }
        
        return await this.getCurrentLocation();
    }

    /**
     * Format location for API calls
     */
    formatLocationForAPI(location) {
        return {
            type: "Point",
            coordinates: [location.longitude, location.latitude] // MongoDB expects [lng, lat]
        };
    }

    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return Math.round(distance * 10) / 10; // Round to 1 decimal
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
}

// Create global instance
window.locationService = new LocationService();
