/**
 * Utility functions for production-ready error handling
 */

(function() {
    'use strict';

    const isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1';

    /**
     * Safe console logging - only logs in development
     */
    window.safeLog = function(...args) {
        if (!isProduction) {
            console.log(...args);
        }
    };

    /**
     * Safe console error - always logs errors but with sanitized messages
     */
    window.safeError = function(...args) {
        if (isProduction) {
            // In production, log errors but sanitize sensitive data
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') {
                    // Remove potential sensitive data
                    return arg.replace(/token[=:]\s*[\w-]+/gi, 'token=***')
                              .replace(/password[=:]\s*\S+/gi, 'password=***')
                              .replace(/authorization[=:]\s*\S+/gi, 'authorization=***');
                }
                return arg;
            });
            console.error(...sanitized);
        } else {
            console.error(...args);
        }
    };

    /**
     * User-friendly error message handler
     */
    window.handleApiError = function(error, defaultMessage = 'An error occurred. Please try again.') {
        let message = defaultMessage;
        
        if (error && typeof error === 'object') {
            if (error.message) {
                message = error.message;
            } else if (error.error) {
                message = error.error;
            } else if (error.response && error.response.data) {
                const data = error.response.data;
                message = data.message || data.error || defaultMessage;
            }
        } else if (typeof error === 'string') {
            message = error;
        }

        // Show user-friendly toast if available
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        }

        return message;
    };

    /**
     * Format error response from API
     */
    window.formatErrorResponse = function(response) {
        if (!response) {
            return 'An unexpected error occurred';
        }

        if (response.data) {
            if (response.data.message) {
                return response.data.message;
            }
            if (response.data.error) {
                return response.data.error;
            }
            if (typeof response.data === 'string') {
                return response.data;
            }
        }

        if (response.status === 401) {
            return 'Please login to continue';
        }
        if (response.status === 403) {
            return 'You do not have permission to perform this action';
        }
        if (response.status === 404) {
            return 'The requested resource was not found';
        }
        if (response.status === 500) {
            return 'A server error occurred. Please try again later';
        }

        return 'An error occurred. Please try again';
    };

})();

