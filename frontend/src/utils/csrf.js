/**
 * CSRF Token Management
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_TOKEN_KEY = 'csrf_token';

/**
 * Generate a random CSRF token
 * @returns {string} - Random hex string
 */
const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Get or create CSRF token
 * @returns {string} - CSRF token
 */
export const getCSRFToken = () => {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  
  if (!token) {
    token = generateToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  
  return token;
};

/**
 * Clear CSRF token (on logout)
 */
export const clearCSRFToken = () => {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
};

/**
 * Add CSRF token to request headers
 * @param {Object} headers - Existing headers object
 * @returns {Object} - Headers with CSRF token
 */
export const addCSRFHeader = (headers = {}) => {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken(),
  };
};
