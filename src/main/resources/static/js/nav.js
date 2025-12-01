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
                (currentPath === '/profile.html' && dataPage === 'profile')) {
                link.classList.add('active');
            }
        });
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

        if (isProfile) {
            // Profile page: only show logout (user must be logged in)
            NAV_CONFIG.loggedIn.forEach(item => {
                nav.appendChild(createNavButton(item));
            });
        } else {
            // Other pages: show based on authentication status
            if (hasToken) {
                // Logged in: show logout
                NAV_CONFIG.loggedIn.forEach(item => {
                    nav.appendChild(createNavButton(item));
                });
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

        // Get navigation elements
        const loginLink = document.getElementById('nav-login-link');
        const registerLink = document.getElementById('nav-register-link');
        const logoutBtn = document.getElementById('logout-btn');

        if (isProfile) {
            // Profile page: hide login/register, show logout
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        } else {
            // Other pages: show/hide based on authentication
            if (hasToken) {
                // Logged in: hide login/register, show logout
                if (loginLink) loginLink.style.display = 'none';
                if (registerLink) registerLink.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            } else {
                // Not logged in: show login/register, hide logout
                if (loginLink) loginLink.style.display = 'inline-flex';
                if (registerLink) registerLink.style.display = 'inline-flex';
                if (logoutBtn) logoutBtn.style.display = 'none';
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
        isAuthenticated: isAuthenticated
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initNavigation();
            setupLogoutHandler();
        });
    } else {
        initNavigation();
        setupLogoutHandler();
    }

})();

