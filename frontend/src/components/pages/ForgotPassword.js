import React, { useState } from 'react';
import { useAuth } from '../../hooks';

function ForgotPassword({ navigateTo }) {
  const { api } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim()
      });

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      // For security reasons, always show success message to prevent email enumeration
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in max-w-md mx-auto mt-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="logo-professional text-3xl font-bold mb-4">MRVL</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent password reset instructions to your email
            </p>
          </div>

          {/* Success Message */}
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              Email Sent!
            </h2>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              If you don't see the email in your inbox, please check your spam folder. 
              The link will expire in 60 minutes.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Send Another Reset Email
            </button>
            
            <button
              onClick={() => navigateTo('home')}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-md mx-auto mt-8">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="logo-professional text-3xl font-bold mb-4">MRVL</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleInputChange}
              required
              disabled={loading}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your email address"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => navigateTo('home')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
          >
            Back to Home
          </button>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If you're having trouble accessing your account, contact our support team at{' '}
              <a 
                href="mailto:support@mrvl.net" 
                className="text-red-600 dark:text-red-400 hover:underline"
              >
                support@mrvl.net
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          For security reasons, we don't disclose whether an email address is registered with us.
          If you don't receive an email, please check your spam folder or try again.
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;