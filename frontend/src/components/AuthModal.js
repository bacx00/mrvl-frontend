import React, { useState } from 'react';
import { useAuth } from '../hooks';

function AuthModal({ isOpen, onClose }) {
  const { login, register, setup2FA, enable2FA, verify2FA, api } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
  
  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FAVerification, setShow2FAVerification] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  const checkPasswordStrength = (password) => {
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Check password strength when password field changes
    if (e.target.name === 'password' && !isLogin) {
      setPasswordStrength(checkPasswordStrength(e.target.value));
    }
    
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      if (formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters');
        return false;
      }
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
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
    
    if (!isLogin) {
      // Check password complexity for registration
      if (!/[A-Z]/.test(formData.password)) {
        setError('Password must contain at least one uppercase letter');
        return false;
      }
      if (!/[a-z]/.test(formData.password)) {
        setError('Password must contain at least one lowercase letter');
        return false;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError('Password must contain at least one number');
        return false;
      }
      if (!/[@$!%*#?&^_\-+=]/.test(formData.password)) {
        setError('Password must contain at least one special character (@$!%*#?&^-_+=)');
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
      let result;
      
      if (isLogin) {
        console.log('🔑 Attempting login...');
        result = await login(formData.email, formData.password);
        
        // Handle 2FA setup required
        if (result.requires_2fa_setup) {
          setTempToken(result.temp_token);
          setShow2FASetup(true);
          setError('');
          setLoading(false);
          return;
        }
        
        // Handle 2FA verification required
        if (result.requires_2fa_verification) {
          setTempToken(result.temp_token);
          setShow2FAVerification(true);
          setError('');
          setLoading(false);
          return;
        }
      } else {
        console.log('📝 Attempting registration...');
        result = await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          password_confirmation: formData.password_confirmation
        });
      }

      if (result.success) {
        setSuccess(isLogin ? 'Login successful!' : 'Account created successfully!');
        
        // Close modal after brief success message
        setTimeout(() => {
          onClose();
          resetModal();
        }, 1500);
      } else {
        setError(result.error || result.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFormData({ name: '', email: '', password: '', password_confirmation: '' });
    setError('');
    setSuccess('');
    setShow2FASetup(false);
    setShow2FAVerification(false);
    setTempToken('');
    setQrCode('');
    setSecret('');
    setTwoFactorCode('');
    setRecoveryCodes([]);
    setShowRecoveryCodes(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordStrength({ score: 0, message: '' });
    setShowForgotPassword(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetModal();
  };

  // Handle 2FA setup flow
  const handle2FASetup = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await setup2FA(tempToken);
      if (result.success) {
        setQrCode(result.data.qr_code_image);
        setSecret(result.data.secret);
        setSuccess('Scan the QR code with your authenticator app');
      } else {
        setError(result.message || 'Failed to setup 2FA');
      }
    } catch (err) {
      console.error('2FA Setup error:', err);
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA enable (after setup)
  const handle2FAEnable = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a 6-digit code from your authenticator app');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await enable2FA(tempToken, twoFactorCode);
      if (result.success) {
        if (result.recovery_codes) {
          setRecoveryCodes(result.recovery_codes);
          setShowRecoveryCodes(true);
        }
        setSuccess('2FA enabled successfully! Login complete.');
        setTimeout(() => {
          onClose();
          resetModal();
        }, 2000);
      } else {
        setError(result.message || 'Invalid code. Please try again.');
        setTwoFactorCode('');
      }
    } catch (err) {
      console.error('2FA Enable error:', err);
      setError(err.message || 'Invalid code. Please try again.');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification (for existing users)
  const handle2FAVerification = async () => {
    if (!twoFactorCode) {
      setError('Please enter your 2FA code or recovery code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await verify2FA(tempToken, twoFactorCode);
      if (result.success) {
        setSuccess('Login successful!');
        setTimeout(() => {
          onClose();
          resetModal();
        }, 1500);
      } else {
        setError('Invalid code. Please try again.');
        setTwoFactorCode('');
      }
    } catch (err) {
      console.error('2FA Verification error:', err);
      setError('Invalid code. Please try again.');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-setup 2FA when the setup screen is shown
  React.useEffect(() => {
    if (show2FASetup && tempToken && !qrCode) {
      handle2FASetup();
    }
  }, [show2FASetup, tempToken, qrCode]);

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', {
        email: formData.email
      });

      if (response.success) {
        // Check if reset link is included in response (for development/email issues)
        if (response.reset_link) {
          setSuccess(
            <div>
              <p className="mb-2">{response.message}</p>
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{response.note}</p>
                <a 
                  href={response.reset_link} 
                  className="text-xs text-blue-600 dark:text-blue-400 break-all hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Click here to reset password
                </a>
              </div>
            </div>
          );
        } else {
          setSuccess('Password reset link sent to your email address');
        }
        // Don't close the modal if we're showing the link
        if (!response.reset_link) {
          setShowForgotPassword(false);
        }
      } else {
        setError(response.message || 'Failed to send reset link');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="logo-professional text-2xl font-bold">
                MRVL
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {show2FASetup ? '2FA Setup Required' : 
                 show2FAVerification ? '2FA Verification' :
                 showRecoveryCodes ? 'Save Recovery Codes' :
                 showForgotPassword ? 'Reset Password' : 
                 isLogin ? 'Welcome Back' : 'Join MRVL'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {show2FASetup 
              ? 'Scan the QR code with your authenticator app'
              : show2FAVerification
              ? 'Enter the 6-digit code from your authenticator app'
              : showRecoveryCodes
              ? 'Save these recovery codes in a safe place - they can only be used once'
              : showForgotPassword 
              ? 'Enter your email address to receive a password reset link'
              : isLogin 
                ? 'Sign in to access your dashboard and join discussions' 
                : 'Create your account to join the Marvel Rivals community'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 dark:text-green-400">✅</span>
                <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* 2FA Setup Screen */}
          {show2FASetup && (
            <div className="space-y-4">
              {qrCode && (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl inline-block mb-4">
                    <img 
                      src={qrCode} 
                      alt="2FA QR Code" 
                      className="max-w-full h-auto mx-auto"
                      style={{ maxWidth: '200px', maxHeight: '200px' }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Can't scan? Manual entry key: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{secret}</code>
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Enter 6-digit code from your authenticator app *
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFactorCode(value);
                  }}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 text-center text-2xl tracking-widest"
                  disabled={loading}
                />
              </div>
              
              <button
                type="button"
                onClick={handle2FAEnable}
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Enable 2FA & Login'}
              </button>
            </div>
          )}

          {/* 2FA Verification Screen */}
          {show2FAVerification && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Enter 6-digit code or recovery code *
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="000000 or recovery code"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 text-center"
                  disabled={loading}
                />
              </div>
              
              <button
                type="button"
                onClick={handle2FAVerification}
                disabled={loading || !twoFactorCode}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </div>
          )}

          {/* Recovery Codes Display */}
          {showRecoveryCodes && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Important: Save These Recovery Codes</span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">
                  These codes can be used to access your account if you lose your phone. Each code can only be used once.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border text-center font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryCodes(false);
                  onClose();
                  resetModal();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300"
              >
                I've Saved My Recovery Codes
              </button>
            </div>
          )}

          {/* Regular Login/Register Form - Hide during 2FA flows */}
          {!show2FASetup && !show2FAVerification && !showRecoveryCodes && (
          <>
          {/* Name Field - Only for Registration */}
          {!isLogin && !showForgotPassword && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Display Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin && !showForgotPassword}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your display name"
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Field - Not for Forgot Password */}
          {!showForgotPassword && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={isLogin ? "Enter your password" : "Min 8 chars, uppercase, lowercase, number, special char"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
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
            </div>
            {/* Password Guidelines and Strength Indicator for Registration */}
            {!isLogin && (
              <div className="mt-2">
                {/* Password Requirements */}
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li className={`flex items-center space-x-2 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span>{formData.password.length >= 8 ? '✓' : '•'}</span>
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span>{/[A-Z]/.test(formData.password) ? '✓' : '•'}</span>
                      <span>One uppercase letter (A-Z)</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[a-z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span>{/[a-z]/.test(formData.password) ? '✓' : '•'}</span>
                      <span>One lowercase letter (a-z)</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span>{/[0-9]/.test(formData.password) ? '✓' : '•'}</span>
                      <span>One number (0-9)</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${/[@$!%*#?&^_\-+=]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span>{/[@$!%*#?&^_\-+=]/.test(formData.password) ? '✓' : '•'}</span>
                      <span>One special character (@$!%*#?&^-_+=)</span>
                    </li>
                  </ul>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Password Strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score <= 4 ? 'text-yellow-500' :
                        passwordStrength.score <= 5 ? 'text-blue-500' :
                        'text-green-500'
                      }`}>
                        {passwordStrength.message}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 4 ? 'bg-yellow-500' :
                          passwordStrength.score <= 5 ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Confirm Password Field - Only for Registration */}
          {!isLogin && !showForgotPassword && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  required={!isLogin && !showForgotPassword}
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
              </div>
            </div>
          )}
          </>
          )}

          {/* Submit Button - Only show for regular login/register/forgot password */}
          {!show2FASetup && !show2FAVerification && !showRecoveryCodes && (
          <button
            type={showForgotPassword ? "button" : "submit"}
            onClick={showForgotPassword ? handleForgotPassword : undefined}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {showForgotPassword 
                    ? 'Send Reset Link' 
                    : isLogin 
                      ? 'Sign In' 
                      : 'Create Account'
                  }
                </span>
              </>
            )}
          </button>
          )}
        </form>

        {/* Footer - Only show for regular login/register/forgot password */}
        {!show2FASetup && !show2FAVerification && !showRecoveryCodes && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          {!showForgotPassword ? (
            <>
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
                <button
                  type="button"
                  onClick={switchMode}
                  disabled={loading}
                  className="ml-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLogin ? 'Sign up here' : 'Sign in instead'}
                </button>
              </div>
              
              {isLogin && (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={loading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?
              </span>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                disabled={loading}
                className="ml-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign in instead
              </button>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
