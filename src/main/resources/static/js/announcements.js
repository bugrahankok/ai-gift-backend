/**
 * Announcement Management
 * Handles loading and displaying announcements from the server
 */

async function loadPublicAnnouncements() {
    try {
        // Load announcement bar
        const barResponse = await fetch('/api/announcements/active/bar');
        if (barResponse.ok) {
            const barData = await barResponse.json();
            if (barData.active !== false && barData.message) {
                updateAnnouncementBar(barData);
            }
        }
        
        // Load popup announcement
        const popupResponse = await fetch('/api/announcements/active/popup');
        if (popupResponse.ok) {
            const popupData = await popupResponse.json();
            if (popupData.active !== false && popupData.message) {
                showPopupAnnouncement(popupData);
            }
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

function updateAnnouncementBar(announcement) {
    const announcementBar = document.getElementById('announcement-bar');
    const announcementIcon = announcementBar?.querySelector('.announcement-icon');
    const announcementText = announcementBar?.querySelector('.announcement-text');
    
    if (announcementBar && announcementIcon && announcementText) {
        announcementIcon.textContent = announcement.icon || '📢';
        announcementText.textContent = announcement.message;
        announcementBar.classList.remove('hidden');
    }
}

function showPopupAnnouncement(announcement) {
    // Check if user has dismissed this popup
    const dismissedId = localStorage.getItem('bookifyai-popup-dismissed');
    if (dismissedId === String(announcement.id)) {
        return; // User already dismissed this popup
    }
    
    // Create popup if it doesn't exist
    let popup = document.getElementById('announcement-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'announcement-popup';
        popup.className = 'announcement-popup';
        popup.innerHTML = `
            <div class="announcement-popup-content">
                <div class="announcement-popup-header">
                    <span class="announcement-popup-icon"></span>
                    <button class="announcement-popup-close" onclick="closePopupAnnouncement()" aria-label="Close announcement">×</button>
                </div>
                <div class="announcement-popup-body">
                    <p class="announcement-popup-text"></p>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }
    
    // Update popup content
    const iconEl = popup.querySelector('.announcement-popup-icon');
    const textEl = popup.querySelector('.announcement-popup-text');
    
    if (iconEl) iconEl.textContent = announcement.icon || '💬';
    if (textEl) textEl.textContent = announcement.message;
    
    // Show popup
    popup.style.display = 'flex';
    popup.setAttribute('data-announcement-id', announcement.id);
}

function closePopupAnnouncement() {
    const popup = document.getElementById('announcement-popup');
    if (popup) {
        const announcementId = popup.getAttribute('data-announcement-id');
        if (announcementId) {
            localStorage.setItem('bookifyai-popup-dismissed', announcementId);
        }
        popup.style.display = 'none';
    }
}

// Export to global scope
window.closePopupAnnouncement = closePopupAnnouncement;

// Auto-load announcements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPublicAnnouncements);
} else {
    loadPublicAnnouncements();
}

