import { toast } from 'react-hot-toast';

/**
 * Centralized error handling utility
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context about where the error occurred
 * @param {Function} customHandler - Optional custom error handler
 */
export const handleApiError = (error, context = '', customHandler = null) => {
  // If a custom handler is provided, use it
  if (customHandler && typeof customHandler === 'function') {
    return customHandler(error);
  }

  // Default error handling
  let errorMessage = 'An unexpected error occurred';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.data?.message) {
    errorMessage = error.data.message;
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  }

  // Add context if provided
  if (context) {
    errorMessage = `${context}: ${errorMessage}`;
  }

  toast.error(errorMessage);
};

/**
 * Success notification utility
 * @param {string} message - Success message to display
 */
export const showSuccess = (message) => {
  toast.success(message);
};

/**
 * Info notification utility
 * @param {string} message - Info message to display
 */
export const showInfo = (message) => {
  toast(message);
};

export default {
  handleApiError,
  showSuccess,
  showInfo
};