/**
 * User Profile Service for RoadRescue360
 * Handles user data storage, retrieval, and profile management
 */

class UserProfileService {
    constructor() {
        this.currentUser = null;
        this.profileData = null;
    }

    /**
     * Get current user from localStorage
     */
    getCurrentUser() {
        try {
            const userToken = localStorage.getItem('rr_user_token');
            if (userToken) {
                const tokenData = JSON.parse(userToken);
                return tokenData;
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Get user profile data from API
     */
    async getUserProfile() {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('No user logged in');
            }

            const response = await fetch(`${BASE_URL}/api/auth/user`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const profileData = JSON.parse(responseText);
            this.profileData = profileData;
            return profileData;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }


    /**
     * Update user profile
     */
    async updateUserProfile(profileData) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('No user logged in');
            }

            const response = await fetch(`${BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Failed to update user profile');
            }

            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const updatedProfile = JSON.parse(responseText);
            this.profileData = updatedProfile;
            return updatedProfile;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Pre-fill form with user data
     */
    prefillForm(formId, fields = {}) {
        const form = document.getElementById(formId);
        if (!form) return;

        const defaultFields = {
            'user-name': this.profileData?.name || '',
            'user-phone': this.profileData?.phone || '',
            'user-email': this.profileData?.email || '',
            'user-location': this.profileData?.address || '',
            'vehicle-details': this.profileData?.vehicleDetails || '',
            'contact-name': this.profileData?.name || '',
            'contact-phone': this.profileData?.phone || '',
            'customer-name': this.profileData?.name || '',
            'customer-phone': this.profileData?.phone || ''
        };

        const fieldsToFill = { ...defaultFields, ...fields };

        Object.entries(fieldsToFill).forEach(([fieldId, value]) => {
            const field = form.querySelector(`#${fieldId}`);
            if (field && value) {
                field.value = value;
            }
        });
    }

    /**
     * Get user's saved location
     */
    async getUserLocation() {
        try {
            if (this.profileData?.address) {
                // Try to geocode the saved address
                if (window.locationService) {
                    const location = await window.locationService.getCurrentLocation();
                    return location;
                }
            }
            
            // Fallback to current GPS location
            if (window.locationService) {
                return await window.locationService.getCurrentLocation();
            }
            
            return null;
        } catch (error) {
            console.warn('Could not get user location:', error);
            return null;
        }
    }

    /**
     * Save user preferences
     */
    saveUserPreferences(preferences) {
        try {
            const userPrefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
            const updatedPrefs = { ...userPrefs, ...preferences };
            localStorage.setItem('user_preferences', JSON.stringify(updatedPrefs));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    /**
     * Get user preferences
     */
    getUserPreferences() {
        try {
            return JSON.parse(localStorage.getItem('user_preferences') || '{}');
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return {};
        }
    }

    /**
     * Initialize user profile service
     */
    async initialize() {
        try {
            const user = this.getCurrentUser();
            if (user) {
                await this.getUserProfile();
                console.log('User profile service initialized');
            }
        } catch (error) {
            console.warn('User profile service initialization failed:', error);
        }
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Get auth headers for API calls
     */
    getAuthHeaders() {
        const user = this.getCurrentUser();
        if (!user) return {};

        return {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Create global instance
window.userProfileService = new UserProfileService();
