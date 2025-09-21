/**
 * Payment Service for RoadRescue360
 * Handles payment processing after service completion
 */

class PaymentService {
    constructor() {
        this.pendingPayments = new Map();
        this.paymentMethods = ['card', 'upi', 'wallet', 'netbanking'];
    }

    /**
     * Calculate service cost
     */
    async calculateServiceCost(serviceId) {
        try {
            const response = await fetch(`${BASE_URL}/api/services/${serviceId}/cost`, {
                headers: window.userProfileService.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to calculate service cost');
            }

            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Error calculating service cost:', error);
            return this.getFallbackCost();
        }
    }

    /**
     * Get fallback cost calculation
     */
    getFallbackCost() {
        return {
            basePrice: 499,
            distancePrice: 150,
            additionalCharges: 0,
            total: 649,
            breakdown: {
                service: 'Roadside Assistance',
                baseFee: 499,
                distanceFee: 150,
                distance: 10,
                additional: 0,
                total: 649
            }
        };
    }

    /**
     * Show payment modal after service completion
     */
    async showPaymentModal(serviceId, serviceData) {
        try {
            const costData = await this.calculateServiceCost(serviceId);
            this.createPaymentModal(serviceId, serviceData, costData);
        } catch (error) {
            console.error('Error showing payment modal:', error);
            // Show fallback payment modal
            this.createPaymentModal(serviceId, serviceData, this.getFallbackCost());
        }
    }

    /**
     * Create payment modal
     */
    createPaymentModal(serviceId, serviceData, costData) {
        // Remove existing payment modal if any
        const existingModal = document.getElementById('payment-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'payment-modal';
        modal.className = 'modal payment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-credit-card"></i> Service Payment</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="service-summary">
                        <h3>Service Completed</h3>
                        <div class="summary-item">
                            <span>Service Type:</span>
                            <span>${serviceData.type || 'Roadside Assistance'}</span>
                        </div>
                        <div class="summary-item">
                            <span>Technician:</span>
                            <span>${serviceData.assignedTechnician?.name || 'Technician'}</span>
                        </div>
                        <div class="summary-item">
                            <span>Completion Time:</span>
                            <span>${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="cost-breakdown">
                        <h3>Cost Breakdown</h3>
                        <div class="cost-item">
                            <span>Base Service Fee:</span>
                            <span>${window.pricingService ? window.pricingService.formatPrice(costData.basePrice) : '₹' + costData.basePrice}</span>
                        </div>
                        <div class="cost-item">
                            <span>Distance Fee (${costData.breakdown.distance} km):</span>
                            <span>${window.pricingService ? window.pricingService.formatPrice(costData.distancePrice) : '₹' + costData.distancePrice}</span>
                        </div>
                        ${costData.additionalCharges > 0 ? `
                        <div class="cost-item">
                            <span>Additional Charges:</span>
                            <span>${window.pricingService ? window.pricingService.formatPrice(costData.additionalCharges) : '₹' + costData.additionalCharges}</span>
                        </div>
                        ` : ''}
                        <div class="cost-total">
                            <span><strong>Total Amount:</strong></span>
                            <span><strong>${window.pricingService ? window.pricingService.formatPrice(costData.total) : '₹' + costData.total}</strong></span>
                        </div>
                    </div>
                    
                    <div class="payment-form">
                        <h3>Payment Method</h3>
                        <div class="payment-methods">
                            ${this.paymentMethods.map(method => `
                                <label class="payment-method">
                                    <input type="radio" name="payment-method" value="${method}" required>
                                    <span class="method-icon">
                                        <i class="fas fa-${this.getPaymentIcon(method)}"></i>
                                    </span>
                                    <span class="method-name">${this.getPaymentMethodName(method)}</span>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div class="payment-details" id="payment-details" style="display: none;">
                            <div class="form-group">
                                <label for="card-number">Card Number / UPI ID</label>
                                <input type="text" id="card-number" placeholder="Enter card number or UPI ID" required>
                            </div>
                            <div class="form-group">
                                <label for="card-name">Name on Card</label>
                                <input type="text" id="card-name" placeholder="Enter name as on card" required>
                            </div>
                            <div class="form-group">
                                <label for="expiry-date">Expiry Date</label>
                                <input type="text" id="expiry-date" placeholder="MM/YY" required>
                            </div>
                            <div class="form-group">
                                <label for="cvv">CVV</label>
                                <input type="text" id="cvv" placeholder="123" required>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal">Cancel</button>
                    <button class="btn btn-primary process-payment" data-service-id="${serviceId}">
                        <i class="fas fa-credit-card"></i> Pay Now
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Add event listeners
        this.addPaymentModalListeners(modal, serviceId, costData);
    }

    /**
     * Add event listeners to payment modal
     */
    addPaymentModalListeners(modal, serviceId, costData) {
        // Close modal
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

        // Show payment details when method is selected
        const paymentMethods = modal.querySelectorAll('input[name="payment-method"]');
        const paymentDetails = modal.querySelector('#payment-details');
        
        paymentMethods.forEach(method => {
            method.addEventListener('change', () => {
                if (method.checked) {
                    paymentDetails.style.display = 'block';
                }
            });
        });

        // Process payment
        const processPaymentBtn = modal.querySelector('.process-payment');
        processPaymentBtn.addEventListener('click', () => {
            this.processPayment(serviceId, costData, modal);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
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
     * Process payment
     */
    async processPayment(serviceId, costData, modal) {
        const processBtn = modal.querySelector('.process-payment');
        const selectedMethod = modal.querySelector('input[name="payment-method"]:checked');
        
        if (!selectedMethod) {
            alert('Please select a payment method');
            return;
        }

        // Show loading state
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const paymentData = {
                serviceId: serviceId,
                amount: costData.total,
                paymentMethod: selectedMethod.value,
                cardNumber: modal.querySelector('#card-number')?.value || '',
                cardName: modal.querySelector('#card-name')?.value || '',
                expiryDate: modal.querySelector('#expiry-date')?.value || '',
                cvv: modal.querySelector('#cvv')?.value || ''
            };

            const response = await fetch(`${BASE_URL}/api/payments/process`, {
                method: 'POST',
                headers: window.userProfileService.getAuthHeaders(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                throw new Error('Payment processing failed');
            }

            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const result = JSON.parse(responseText);
            
            // Show success message
            this.showPaymentSuccess(result);
            
            // Close modal
            modal.style.display = 'none';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);

        } catch (error) {
            console.error('Payment processing error:', error);
            alert('Payment failed: ' + error.message);
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = '<i class="fas fa-credit-card"></i> Pay Now';
        }
    }

    /**
     * Show payment success message
     */
    showPaymentSuccess(paymentResult) {
        const successModal = document.createElement('div');
        successModal.className = 'modal success-modal';
        successModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-check-circle"></i> Payment Successful</h2>
                </div>
                <div class="modal-body">
                    <div class="success-message">
                        <p>Your payment has been processed successfully!</p>
                        <p><strong>Transaction ID:</strong> ${paymentResult.transactionId || 'N/A'}</p>
                        <p><strong>Amount Paid:</strong> ${window.pricingService ? window.pricingService.formatPrice(paymentResult.amount) : '₹' + paymentResult.amount}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary close-modal">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(successModal);
        successModal.style.display = 'flex';

        // Close success modal
        const closeBtn = successModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            successModal.style.display = 'none';
            setTimeout(() => {
                if (document.body.contains(successModal)) {
                    document.body.removeChild(successModal);
                }
            }, 300);
        });
    }

    /**
     * Get payment method icon
     */
    getPaymentIcon(method) {
        const icons = {
            card: 'credit-card',
            upi: 'mobile-alt',
            wallet: 'wallet',
            netbanking: 'university'
        };
        return icons[method] || 'credit-card';
    }

    /**
     * Get payment method name
     */
    getPaymentMethodName(method) {
        const names = {
            card: 'Credit/Debit Card',
            upi: 'UPI Payment',
            wallet: 'Digital Wallet',
            netbanking: 'Net Banking'
        };
        return names[method] || method;
    }
}

// Create global instance
window.paymentService = new PaymentService();
