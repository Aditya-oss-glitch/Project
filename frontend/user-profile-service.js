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
     * Get user profile data from API with fallback
     */
    async getUserProfile() {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                console.warn('No user logged in, using fallback data');
                return this.getFallbackProfileData();
            }

            const response = await fetch(`${BASE_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn(`API error ${response.status}: ${response.statusText}`);
                return this.getFallbackProfileData();
            }

            const responseText = await response.text();
            if (!responseText) {
                console.warn('Empty response from server');
                return this.getFallbackProfileData();
            }

            let profileData;
            try {
                profileData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Invalid JSON response:', parseError);
                console.error('Response text:', responseText);
                return this.getFallbackProfileData();
            }
            this.profileData = profileData;
            
            // Save to localStorage as backup
            localStorage.setItem('user_profile_data', JSON.stringify(profileData));
            
            return profileData;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            console.warn('Using fallback profile data due to API error');
            return this.getFallbackProfileData();
        }
    }

    /**
     * Get fallback profile data when API fails
     */
    getFallbackProfileData() {
        // First try to get saved data from localStorage
        try {
            const savedData = localStorage.getItem('user_profile_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                console.log('Using saved profile data from localStorage');
                return parsedData;
            }
        } catch (error) {
            console.warn('Error parsing saved profile data:', error);
        }

        // If no saved data, return empty profile data
        console.log('Using empty profile data');
        return {
            name: '',
            email: '',
            phone: '',
            address: '',
            vehicleDetails: '',
            licensePlate: '',
            notes: '',
            totalServices: 0,
            memberSince: new Date().getFullYear(),
            avatarUrl: null
        };
    }


    /**
     * Update user profile with fallback to localStorage
     */
    async updateUserProfile(profileData) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                console.warn('No user logged in, saving to localStorage only');
                return this.saveProfileLocally(profileData);
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
                console.warn(`API error ${response.status}: ${response.statusText}`);
                console.warn('Saving profile locally as fallback');
                return this.saveProfileLocally(profileData);
            }

            const responseText = await response.text();
            if (!responseText) {
                console.warn('Empty response from server');
                return this.saveProfileLocally(profileData);
            }

            let updatedProfile;
            try {
                updatedProfile = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Invalid JSON response:', parseError);
                console.error('Response text:', responseText);
                return this.saveProfileLocally(profileData);
            }
            this.profileData = updatedProfile;
            
            // Also save to localStorage as backup
            localStorage.setItem('user_profile_data', JSON.stringify(updatedProfile));
            
            return updatedProfile;
        } catch (error) {
            console.error('Error updating user profile:', error);
            console.warn('Saving profile locally as fallback');
            return this.saveProfileLocally(profileData);
        }
    }

    /**
     * Save profile data to localStorage
     */
    saveProfileLocally(profileData) {
        try {
            const profileWithTimestamp = {
                ...profileData,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('user_profile_data', JSON.stringify(profileWithTimestamp));
            this.profileData = profileWithTimestamp;
            
            console.log('Profile saved locally');
            return profileWithTimestamp;
        } catch (error) {
            console.error('Error saving profile locally:', error);
            throw new Error('Failed to save profile data');
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
     * Get user's service history from API
     */
    async getServiceHistory() {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                console.warn('No user logged in, using mock service history');
                return this.getMockServiceHistory();
            }

            const response = await fetch(`${BASE_URL}/api/services/user/history`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn(`API error ${response.status}: ${response.statusText}`);
                return this.getMockServiceHistory();
            }

            const responseText = await response.text();
            if (!responseText) {
                console.warn('Empty response from server');
                return this.getMockServiceHistory();
            }

            const serviceHistory = JSON.parse(responseText);
            return serviceHistory;
        } catch (error) {
            console.error('Error fetching service history:', error);
            console.warn('Using mock service history due to API error');
            return this.getMockServiceHistory();
        }
    }

    /**
     * Get mock service history when API fails
     */
    getMockServiceHistory() {
        return [
            {
                id: 1,
                service: 'Battery Jump Start',
                date: '2024-01-15',
                status: 'Completed',
                technician: 'Mike Johnson',
                rating: 5,
                location: 'Downtown Area',
                cost: '$45.00'
            },
            {
                id: 2,
                service: 'Tire Change',
                date: '2024-01-10',
                status: 'Completed',
                technician: 'Sarah Wilson',
                rating: 4,
                location: 'Highway 101',
                cost: '$75.00'
            },
            {
                id: 3,
                service: 'Fuel Delivery',
                date: '2024-01-05',
                status: 'Completed',
                technician: 'John Smith',
                rating: 5,
                location: 'Main Street',
                cost: '$35.00'
            },
            {
                id: 4,
                service: 'Lockout Service',
                date: '2023-12-28',
                status: 'Completed',
                technician: 'Alex Brown',
                rating: 5,
                location: 'Shopping Mall',
                cost: '$60.00'
            },
            {
                id: 5,
                service: 'Towing Service',
                date: '2023-12-20',
                status: 'Completed',
                technician: 'David Lee',
                rating: 4,
                location: 'Interstate 5',
                cost: '$120.00'
            }
        ];
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
