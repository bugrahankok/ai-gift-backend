/**
 * Centralized Navigation Bar Management
 * Handles dynamic creation and updates of navigation bar across all pages
 */

(function() {
    'use strict';

    const NAV_CONFIG = {
        // Navigation items that are always visible
        alwaysVisible: [
            { href: '/', text: '🏠 Home', dataPage: 'home' },
            { href: '/profile.html', text: '👤 Profile', dataPage: 'profile' }
        ],
        // Navigation items for admin users
        admin: [
            { href: '/admin.html', text: '⚙️ Admin Panel', dataPage: 'admin', id: 'nav-admin-link' }
        ],
        // Navigation items for logged-in users
        loggedIn: [
            { type: 'button', text: '🚪 Logout', id: 'logout-btn', className: 'nav-link nav-btn' }
        ],
        // Navigation items for logged-out users
        loggedOut: [
            { href: '/login.html', text: '🔐 Login', dataPage: 'login', id: 'nav-login-link' },
            { href: '/register.html', text: '📝 Register', dataPage: 'register', id: 'nav-register-link' }
        ]
    };

    /**
     * Check if user is authenticated
     */
    function isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    /**
     * Get current page path
     */
    function getCurrentPath() {
        return window.location.pathname;
    }

    /**
     * Check if current page is profile page
     */
    function isProfilePage() {
        return getCurrentPath() === '/profile.html';
    }

    /**
     * Create navigation link element
     */
    function createNavLink(item) {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = 'nav-link';
        link.textContent = item.text;
        if (item.dataPage) {
            link.setAttribute('data-page', item.dataPage);
        }
        if (item.id) {
            link.id = item.id;
        }
        return link;
    }

    /**
     * Create navigation button element
     */
    function createNavButton(item) {
        const button = document.createElement('button');
        button.className = item.className || 'nav-link nav-btn';
        button.textContent = item.text;
        if (item.id) {
            button.id = item.id;
        }
        return button;
    }

    /**
     * Set active state for navigation links
     */
    function setActiveState(nav) {
        const currentPath = getCurrentPath();
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            const dataPage = link.getAttribute('data-page');
            
            if (href === currentPath || 
                (currentPath === '/' && dataPage === 'home') ||
                (currentPath === '/profile.html' && dataPage === 'profile') ||
                (currentPath === '/admin.html' && dataPage === 'admin')) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Check if current user is admin
     */
    function isAdmin() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                return user.isAdmin === true;
            }
            // If userInfo doesn't exist but user is logged in, try to fetch it
            const token = localStorage.getItem('authToken');
            if (token) {
                // Try to get user info from API
                fetchUserInfo();
            }
            return false;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Fetch user info from API and update localStorage
     */
    async function fetchUserInfo() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userProfile = await response.json();
                // Store user info including isAdmin
                localStorage.setItem('userInfo', JSON.stringify({
                    email: userProfile.email,
                    name: userProfile.name,
                    userId: userProfile.userId,
                    isAdmin: userProfile.isAdmin || false
                }));
                // Update navigation after getting user info
                updateNavigationBar();
            }
        } catch (e) {
            // Silently fail - user might not be logged in
        }
    }

    /**
     * Create navigation bar HTML structure
     */
    function createNavigationBar() {
        const nav = document.createElement('nav');
        nav.className = 'header-nav';
        nav.id = 'header-nav';

        // Add always visible items
        NAV_CONFIG.alwaysVisible.forEach(item => {
            nav.appendChild(createNavLink(item));
        });

        // Add conditional items based on authentication and page
        const hasToken = isAuthenticated();
        const isProfile = isProfilePage();
        const userIsAdmin = isAdmin();

        if (isProfile) {
            // Profile page: only show logout (user must be logged in)
            NAV_CONFIG.loggedIn.forEach(item => {
                nav.appendChild(createNavButton(item));
            });
            // Add admin panel link if user is admin
            if (userIsAdmin) {
                NAV_CONFIG.admin.forEach(item => {
                    nav.appendChild(createNavLink(item));
                });
            }
        } else {
            // Other pages: show based on authentication status
            if (hasToken) {
                // Logged in: show logout
                NAV_CONFIG.loggedIn.forEach(item => {
                    nav.appendChild(createNavButton(item));
                });
                // Add admin panel link if user is admin
                if (userIsAdmin) {
                    NAV_CONFIG.admin.forEach(item => {
                        nav.appendChild(createNavLink(item));
                    });
                }
            } else {
                // Not logged in: show login/register
                NAV_CONFIG.loggedOut.forEach(item => {
                    nav.appendChild(createNavLink(item));
                });
            }
        }

        return nav;
    }

    /**
     * Update navigation bar visibility
     */
    function updateNavigationBar() {
        const nav = document.getElementById('header-nav');
        if (!nav) return;

        const hasToken = isAuthenticated();
        const isProfile = isProfilePage();
        const userIsAdmin = isAdmin();

        // Get navigation elements
        const loginLink = document.getElementById('nav-login-link');
        const registerLink = document.getElementById('nav-register-link');
        const logoutBtn = document.getElementById('logout-btn');
        const adminLink = document.getElementById('nav-admin-link');

        if (isProfile) {
            // Profile page: hide login/register, show logout
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            // Show/hide admin link
            if (adminLink) {
                adminLink.style.display = userIsAdmin ? 'inline-flex' : 'none';
            }
        } else {
            // Other pages: show/hide based on authentication
            if (hasToken) {
                // Logged in: hide login/register, show logout
                if (loginLink) loginLink.style.display = 'none';
                if (registerLink) registerLink.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'inline-flex';
                // Show/hide admin link
                if (adminLink) {
                    adminLink.style.display = userIsAdmin ? 'inline-flex' : 'none';
                } else if (userIsAdmin) {
                    // Create admin link if it doesn't exist
                    NAV_CONFIG.admin.forEach(item => {
                        const existingLink = document.getElementById(item.id);
                        if (!existingLink) {
                            nav.appendChild(createNavLink(item));
                        }
                    });
                }
            } else {
                // Not logged in: show login/register, hide logout and admin
                if (loginLink) loginLink.style.display = 'inline-flex';
                if (registerLink) registerLink.style.display = 'inline-flex';
                if (logoutBtn) logoutBtn.style.display = 'none';
                if (adminLink) adminLink.style.display = 'none';
            }
        }

        // Update active state
        setActiveState(nav);
    }

    /**
     * Initialize navigation bar
     * Call this function when page loads
     */
    function initNavigation() {
        const headerContent = document.querySelector('.header-content');
        if (!headerContent) {
            console.warn('Header content not found. Navigation bar cannot be initialized.');
            return;
        }

        // Check if navigation already exists
        let nav = document.getElementById('header-nav');
        
        if (!nav) {
            // Create navigation bar if it doesn't exist
            nav = createNavigationBar();
            headerContent.appendChild(nav);
        } else {
            // Update existing navigation bar
            updateNavigationBar();
        }

        // Set active state
        setActiveState(nav);
    }

    /**
     * Setup logout button handler
     * Call this after initializing navigation
     */
    function setupLogoutHandler() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn && !logoutBtn.hasAttribute('data-listener-attached')) {
            logoutBtn.setAttribute('data-listener-attached', 'true');
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userId');
                localStorage.removeItem('userInfo');
                document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                
                // Update navigation immediately
                updateNavigationBar();
                
                // Show toast if available
                if (typeof showToast === 'function') {
                    showToast('Logged out successfully', 'success');
                }
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            });
        }
    }

    // Export functions to global scope
    window.Navigation = {
        init: initNavigation,
        update: updateNavigationBar,
        setupLogout: setupLogoutHandler,
        isAuthenticated: isAuthenticated,
        isAdmin: isAdmin
    };

    /**
     * Setup announcement bar
     * Handles showing/hiding the announcement bar based on user preference
     * Note: Actual content is loaded by announcements.js
     */
    function setupAnnouncementBar() {
        const announcementBar = document.getElementById('announcement-bar');
        const closeBtn = document.getElementById('announcement-close');
        
        if (!announcementBar || !closeBtn) return;
        
        // Check if user has dismissed the announcement
        const dismissed = localStorage.getItem('bookifyai-announcement-dismissed');
        if (dismissed === 'true') {
            announcementBar.classList.add('hidden');
        }
        
        // Close button functionality
        closeBtn.addEventListener('click', () => {
            announcementBar.classList.add('hidden');
            localStorage.setItem('bookifyai-announcement-dismissed', 'true');
        });
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initNavigation();
            setupLogoutHandler();
            setupAnnouncementBar();
            // Fetch user info if logged in but userInfo doesn't exist
            const token = localStorage.getItem('authToken');
            const userInfo = localStorage.getItem('userInfo');
            if (token && !userInfo) {
                fetchUserInfo();
            }
        });
    } else {
        initNavigation();
        setupLogoutHandler();
        setupAnnouncementBar();
        // Fetch user info if logged in but userInfo doesn't exist
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo');
        if (token && !userInfo) {
            fetchUserInfo();
        }
    }

})();

