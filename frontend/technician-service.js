/**
 * Technician Service for RoadRescue360
 * Handles dynamic technician data and assignments
 */

class TechnicianService {
    constructor() {
        this.assignedTechnician = null;
        // No hardcoded data - all data comes from backend
    }

    /**
     * Get technician data from API
     */
    async getTechnicianData(technicianId) {
        try {
            const response = await fetch(`${BASE_URL}/api/technicians/${technicianId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch technician data');
            }
            
            const data = await response.text();
            if (!data) {
                throw new Error('Empty response from server');
            }
            
            return JSON.parse(data);
        } catch (error) {
            console.error('Error fetching technician data:', error);
            throw error;
        }
    }

    /**
     * Get assigned technician for a service
     */
    async getAssignedTechnician(serviceId) {
        try {
            const response = await fetch(`${BASE_URL}/api/services/${serviceId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch service data');
            }
            
            const data = await response.text();
            if (!data) {
                throw new Error('Empty response from server');
            }
            
            const service = JSON.parse(data);
            return service.assignedTechnician;
        } catch (error) {
            console.error('Error fetching assigned technician:', error);
            return null;
        }
    }


    /**
     * Update technician display in UI
     */
    updateTechnicianDisplay(technician) {
        const technicianNameEl = document.getElementById('technician-name');
        const technicianPhoneEl = document.getElementById('technician-phone');
        const technicianRatingEl = document.getElementById('technician-rating');
        
        if (technicianNameEl) {
            technicianNameEl.textContent = technician.name;
        }
        
        if (technicianPhoneEl) {
            technicianPhoneEl.textContent = technician.phone;
        }
        
        if (technicianRatingEl) {
            technicianRatingEl.textContent = `⭐ ${technician.rating.toFixed(1)}`;
        }
    }

    /**
     * Get random technician name for simulation
     * This should be replaced with real technician data from backend
     */
    getRandomTechnicianName() {
        // This function should be removed or updated to use real technician data
        console.warn('getRandomTechnicianName: Using fallback name. Should use real technician data from backend.');
        return 'Technician';
    }

    /**
     * Get auth token from localStorage
     */
    getAuthToken() {
        try {
            const userToken = localStorage.getItem('rr_user_token');
            const techToken = localStorage.getItem('rr_tech_token');
            return userToken || techToken;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    /**
     * Calculate ETA based on distance and traffic
     */
    calculateETA(distance, trafficLevel = 'normal') {
        const baseSpeed = 25; // km/h base speed
        const trafficMultipliers = {
            'light': 1.0,
            'normal': 1.3,
            'heavy': 1.8,
            'severe': 2.5
        };
        
        const multiplier = trafficMultipliers[trafficLevel] || trafficMultipliers['normal'];
        const adjustedSpeed = baseSpeed / multiplier;
        const etaMinutes = Math.round((distance / adjustedSpeed) * 60);
        
        return Math.max(etaMinutes, 5); // Minimum 5 minutes
    }

    /**
     * Get status message based on service status
     */
    getStatusMessage(status) {
        const statusMessages = {
            'pending': 'Searching for technician...',
            'assigned': 'Technician assigned and on the way',
            'in_progress': 'Technician is working on your vehicle',
            'completed': 'Service completed successfully',
            'cancelled': 'Service request cancelled'
        };
        
        return statusMessages[status] || 'Status unknown';
    }
}

// Create global instance
window.technicianService = new TechnicianService();
