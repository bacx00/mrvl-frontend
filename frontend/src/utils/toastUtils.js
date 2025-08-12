/**
 * Universal Toast Utility for MRVL Frontend
 * Provides consistent toast notifications across all components
 */

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 * @param {string} position - Position of toast (default: 'top-right')
 */
export const showToast = (message, type = 'info', duration = 3000, position = 'top-right') => {
  // Remove any existing toasts to prevent overlap
  const existingToasts = document.querySelectorAll('.mrvl-toast');
  existingToasts.forEach(toast => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  });

  const toast = document.createElement('div');
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Type-specific styling
  const typeClasses = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
    info: 'bg-blue-500 text-white border-blue-600',
    achievement: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-orange-600'
  };

  // Icons for each type
  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    achievement: '🏆'
  };

  const positionClass = positionClasses[position] || positionClasses['top-right'];
  const typeClass = typeClasses[type] || typeClasses['info'];
  const icon = typeIcons[type] || typeIcons['info'];

  toast.className = `mrvl-toast fixed ${positionClass} z-[9999] px-4 py-3 rounded-lg shadow-lg border-l-4 ${typeClass} font-medium max-w-sm transform transition-all duration-300 ease-in-out translate-x-full opacity-0`;
  
  // Create toast content with icon
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="text-lg">${icon}</span>
      <span class="flex-1">${message}</span>
      <button class="ml-2 text-white/80 hover:text-white transition-colors" onclick="this.parentElement.parentElement.remove()">
        ×
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  });

  // Auto remove after duration
  setTimeout(() => {
    if (document.body.contains(toast)) {
      // Animate out
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }
  }, duration);

  return toast;
};

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds
 */
export const showSuccessToast = (message, duration = 3000) => {
  return showToast(message, 'success', duration);
};

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds
 */
export const showErrorToast = (message, duration = 4000) => {
  return showToast(message, 'error', duration);
};

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {number} duration - Duration in milliseconds
 */
export const showWarningToast = (message, duration = 3500) => {
  return showToast(message, 'warning', duration);
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {number} duration - Duration in milliseconds
 */
export const showInfoToast = (message, duration = 3000) => {
  return showToast(message, 'info', duration);
};

/**
 * Show achievement toast (special styling)
 * @param {string} message - Achievement message
 * @param {number} duration - Duration in milliseconds
 */
export const showAchievementToast = (message, duration = 5000) => {
  return showToast(message, 'achievement', duration);
};

export default {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showAchievementToast
};