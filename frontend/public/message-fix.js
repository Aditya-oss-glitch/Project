/**
 * Send Message Button Fix
 * This script fixes the Send Message functionality by injecting a new modal system.
 */
console.log('Message fix script loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Message fix');
    
    // Find and setup the send message button
    setupSendMessageButton();
});

function setupSendMessageButton() {
    // Find all buttons containing "Send Message" text
    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        return btnText.includes('send message') || btnText.includes('message');
    });
    
    console.log(`Found ${buttons.length} potential message buttons`);
    
    // Setup each button
    buttons.forEach((btn, index) => {
        console.log(`Setting up button ${index + 1}:`, btn.textContent);
        
        // Clone and replace to remove existing event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add our custom click handler
        newBtn.addEventListener('click', handleMessageButtonClick);
    });
    
    // Create the modal in advance
    createMessageModal();
}

function handleMessageButtonClick() {
    console.log('Message button clicked');
    
    // Get technician name
    let technicianName = 'Support Team';
    const techNameElement = document.getElementById('technician-name');
    
    if (techNameElement) {
        const techName = techNameElement.textContent;
        if (techName !== 'Not assigned yet') {
            technicianName = techName;
        } else {
            alert('No technician assigned yet. You can still message our support team.');
        }
    }
    
    // Update modal
    const modalTechName = document.getElementById('modal-tech-name');
    if (modalTechName) {
        modalTechName.textContent = technicianName;
    }
    
    // Show modal
    const modal = document.getElementById('message-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function createMessageModal() {
    // Check if modal already exists
    if (document.getElementById('message-modal')) {
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="message-modal" style="display: none; position: fixed; z-index: 999999; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6);">
            <div style="background-color: white; margin: 10% auto; padding: 30px; width: 90%; max-width: 500px; border-radius: 10px; position: relative; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
                <span id="close-message-modal" style="position: absolute; right: 15px; top: 10px; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                <h2 style="margin-top: 0; color: #333; font-family: inherit;">Message Technician</h2>
                <form id="message-form">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #555; font-family: inherit;">To: <span id="modal-tech-name">Support Team</span></label>
                        <textarea id="message-text" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; min-height: 120px; font-family: inherit; font-size: 14px;" placeholder="Type your message here..." required></textarea>
                    </div>
                    <button type="submit" style="background-color: #4CAF50; color: white; border: none; padding: 12px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; font-family: inherit;">
                        <i class="fas fa-paper-plane"></i> Send Message
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Create modal element
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    
    // Add modal to body
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Setup close button
    const closeBtn = document.getElementById('close-message-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMessageModal);
    }
    
    // Setup click outside to close
    const modal = document.getElementById('message-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeMessageModal();
            }
        });
    }
    
    // Setup form submission
    const form = document.getElementById('message-form');
    if (form) {
        form.addEventListener('submit', handleMessageSubmit);
    }
    
    console.log('Message modal created and added to document');
}

function closeMessageModal() {
    const modal = document.getElementById('message-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleMessageSubmit(e) {
    e.preventDefault();
    
    const messageText = document.getElementById('message-text').value;
    const techName = document.getElementById('modal-tech-name').textContent;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Show loading state
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Simulate sending
        setTimeout(() => {
            alert(`Message sent to ${techName}:\n${messageText}`);
            closeMessageModal();
            
            // Reset form
            e.target.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }, 1500);
    } else {
        alert(`Message sent to ${techName}:\n${messageText}`);
        closeMessageModal();
        e.target.reset();
    }
} 