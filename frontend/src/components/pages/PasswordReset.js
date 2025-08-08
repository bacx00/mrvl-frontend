import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function PasswordReset({ navigateTo, params }) {
  const { api } = useAuth();
  const [formData, setFormData] = useState({
    email: params?.email || '',
    password: '',
    password_confirmation: '',
    token: params?.token || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Update form data when params change (from router)
    if (params?.token && params?.email) {
      setFormData(prev => ({
        ...prev,
        token: params.token,
        email: params.email
      }));
    }
    
    // Fallback: Extract token and email from URL params if not in props
    if (!params?.token || !params?.email) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const urlEmail = urlParams.get('email');
      
      if (urlToken && urlEmail) {
        setFormData(prev => ({
          ...prev,
          token: urlToken,
          email: urlEmail
        }));
      }
    }
  }, [params]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.token.trim()) {
      setError('Invalid reset token');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    
    if (!formData.password_confirmation) {
      setError('Please confirm your password');
      return false;
    }
    
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', {
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        token: formData.token
      });

      if (response.success) {
        setSuccess('Password reset successfully! You can now sign in with your new password.');
        setTimeout(() => {
          navigateTo('home');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-md mx-auto mt-8">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="logo-professional text-3xl font-bold mb-4">MRVL</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          </div>
        )}

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
          {/* Email Field (readonly) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              New Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your new password (min 8 characters)"
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Confirm New Password *
            </label>
            <input
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleInputChange}
              required
              disabled={loading}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Confirm your new password"
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
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigateTo('home')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;