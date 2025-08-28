import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';

function PasswordResetForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [formData, setFormData] = useState({
    token: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
  
  useEffect(() => {
    // Get token and email from URL parameters
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
      setError('Invalid password reset link. Please request a new one.');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      token: token,
      email: email
    }));
  }, [searchParams]);
  
  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) {
      message = 'Weak password';
    } else if (score <= 4) {
      message = 'Moderate password';
    } else {
      message = 'Strong password';
    }
    
    return { score, message };
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'password') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.password || !formData.password_confirmation) {
      setError('Please fill in all fields');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    
    // Check password requirements
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
    
    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
      setError('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/auth/reset-password', {
        token: formData.token,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      });
      
      if (response.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/?login=true');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-red-600 mb-2">MRVL</div>
          <h2 className="text-2xl font-bold text-white">Reset Your Password</h2>
          <p className="text-gray-400 mt-2">Enter your new password below</p>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <span className="text-sm text-red-400">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-sm text-green-400">{success}</span>
            </div>
          </div>
        )}
        
        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-700 text-gray-400 cursor-not-allowed"
              />
            </div>
            
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
              {formData.password && (
                <div className={`mt-2 text-xs ${
                  passwordStrength.score <= 2 ? 'text-red-400' :
                  passwordStrength.score <= 4 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {passwordStrength.message}
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-3 pr-12 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
              {formData.password && formData.password_confirmation && (
                <div className={`mt-2 text-xs ${
                  formData.password === formData.password_confirmation ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formData.password === formData.password_confirmation ? '✅ Passwords match' : '❌ Passwords do not match'}
                </div>
              )}
            </div>
            
            {/* Password Requirements */}
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <p className="text-xs font-semibold text-gray-400 mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className={formData.password.length >= 8 ? 'text-green-400' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'text-green-400' : ''}>
                  • One lowercase letter
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'text-green-400' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-400' : ''}>
                  • One number
                </li>
                <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-400' : ''}>
                  • One special character
                </li>
              </ul>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        {/* Footer Links */}
        {!success && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <button
                onClick={() => navigate('/?login=true')}
                className="text-red-500 hover:text-red-400 font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Need a new reset link?{' '}
              <button
                onClick={() => navigate('/?forgot=true')}
                className="text-red-500 hover:text-red-400 font-semibold transition-colors"
              >
                Request Again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordResetForm;