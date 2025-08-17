/**
 * Password Field Enhancement Utilities
 * Provides reusable components and utilities for password visibility toggle
 */

import React from 'react';

export const PasswordVisibilityToggle = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
    tabIndex={-1}
  >
    {show ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )}
  </button>
);

export const checkPasswordStrength = (password) => {
  let score = 0;
  let message = '';
  
  if (!password) {
    return { score: 0, message: '' };
  }
  
  // Check length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Check for character types
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@$!%*#?&^_\-+=]/.test(password)) score++;
  
  // Determine strength message
  if (score <= 2) {
    message = 'Weak';
  } else if (score <= 4) {
    message = 'Fair';
  } else if (score <= 5) {
    message = 'Good';
  } else {
    message = 'Strong';
  }
  
  return { score, message };
};

export const validatePasswordComplexity = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*#?&^_\-+=]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*#?&^-_+=)');
  }
  
  if (/\s/.test(password)) {
    errors.push('Password must not contain spaces');
  }
  
  return errors;
};

export const PasswordStrengthIndicator = ({ password }) => {
  const strength = checkPasswordStrength(password);
  
  if (!password) return null;
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">Password Strength:</span>
        <span className={`text-xs font-semibold ${
          strength.score <= 2 ? 'text-red-500' :
          strength.score <= 4 ? 'text-yellow-500' :
          strength.score <= 5 ? 'text-blue-500' :
          'text-green-500'
        }`}>
          {strength.message}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            strength.score <= 2 ? 'bg-red-500' :
            strength.score <= 4 ? 'bg-yellow-500' :
            strength.score <= 5 ? 'bg-blue-500' :
            'bg-green-500'
          }`}
          style={{ width: `${(strength.score / 6) * 100}%` }}
        />
      </div>
    </div>
  );
};

export const PASSWORD_PLACEHOLDER = "Min 8 chars, uppercase, lowercase, number, special char";