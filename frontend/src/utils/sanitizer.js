import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Potentially unsafe HTML string
 * @param {Object} config - DOMPurify configuration options
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (dirty, config = {}) => {
  if (!dirty) return '';
  
  const defaultConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ...config
  };
  
  return DOMPurify.sanitize(dirty, defaultConfig);
};

/**
 * Sanitize plain text by stripping all HTML tags
 * @param {string} dirty - Potentially unsafe string
 * @returns {string} - Plain text without HTML
 */
export const sanitizeText = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

/**
 * Sanitize user input for safe display
 * Removes scripts, iframes, and other dangerous content
 * @param {string} input - User input string
 * @returns {string} - Sanitized string
 */
export const sanitizeUserInput = (input) => {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
    ALLOWED_ATTR: []
  });
};
