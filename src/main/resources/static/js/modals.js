/**
 * Modal Management Utility
 * Handles opening and closing modals across all pages
 */

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function initializeModals() {
    // Privacy modal
    const privacyLink = document.getElementById('privacy-link');
    const privacyModal = document.getElementById('privacy-modal');
    const privacyClose = document.getElementById('privacy-close');
    
    if (privacyLink && privacyModal) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('privacy-modal');
        });
    }
    
    if (privacyClose && privacyModal) {
        privacyClose.addEventListener('click', () => {
            closeModal('privacy-modal');
        });
    }
    
    // Terms modal
    const termsLink = document.getElementById('terms-link');
    const termsModal = document.getElementById('terms-modal');
    const termsClose = document.getElementById('terms-close');
    
    if (termsLink && termsModal) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('terms-modal');
        });
    }
    
    if (termsClose && termsModal) {
        termsClose.addEventListener('click', () => {
            closeModal('terms-modal');
        });
    }
    
    // Close modal when clicking outside
    if (privacyModal) {
        privacyModal.addEventListener('click', (e) => {
            if (e.target === privacyModal) {
                closeModal('privacy-modal');
            }
        });
    }
    
    if (termsModal) {
        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) {
                closeModal('terms-modal');
            }
        });
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModals);
} else {
    initializeModals();
}

// Export functions to global scope
window.openModal = openModal;
window.closeModal = closeModal;

