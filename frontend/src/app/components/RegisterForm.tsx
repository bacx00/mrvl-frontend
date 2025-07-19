// src/components/RegisterForm.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

interface RegisterFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  showSocialRegister?: boolean;
  requireEmailVerification?: boolean;
  className?: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter: boolean;
}

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  showSocialRegister = true,
  requireEmailVerification = true,
  className = ''
}) => {
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    newsletter: false
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const checkUsernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus first field on mount
  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password: string): PasswordStrength => {
    if (!password) {
      return { score: 0, label: 'Enter password', color: '#768894', suggestions: [] };
    }

    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 8) score += 20;
    else suggestions.push('Use at least 8 characters');

    if (password.length >= 12) score += 10;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 10;
    else suggestions.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 10;
    else suggestions.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 10;
    else suggestions.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    else suggestions.push('Include special characters');

    // Common patterns penalty
    if (/(.)\1{2,}/.test(password)) score -= 10;
    if (/123|abc|qwe/i.test(password)) score -= 15;

    // Dictionary words penalty (basic check)
    const commonWords = ['password', 'admin', 'user', 'login', 'marvel', 'rivals'];
    if (commonWords.some(word => password.toLowerCase().includes(word))) {
      score -= 20;
      suggestions.push('Avoid common words');
    }

    score = Math.max(0, Math.min(100, score));

    let label: string;
    let color: string;

    if (score < 30) {
      label = 'Weak';
      color = '#ef4444';
    } else if (score < 60) {
      label = 'Fair';
      color = '#f59e0b';
    } else if (score < 80) {
      label = 'Good';
      color = '#10b981';
    } else {
      label = 'Strong';
      color = '#4ade80';
    }

    return { score, label, color, suggestions };
  }, []);

  // Username availability check
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);

    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    if (checkUsernameTimeoutRef.current) {
      clearTimeout(checkUsernameTimeoutRef.current);
    }

    if (formData.username.length >= 3) {
      checkUsernameTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(formData.username);
      }, 500);
    } else {
      setUsernameAvailable(null);
    }

    return () => {
      if (checkUsernameTimeoutRef.current) {
        clearTimeout(checkUsernameTimeoutRef.current);
      }
    };
  }, [formData.username, checkUsernameAvailability]);

  // Password strength update
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password, calculatePasswordStrength]);

  // Form validation
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step >= 1) {
      // Username validation
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (formData.username.length > 20) {
        newErrors.username = 'Username must be less than 20 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
      } else if (usernameAvailable === false) {
        newErrors.username = 'Username is already taken';
      }

      // Email validation
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (step >= 2) {
      // Password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (passwordStrength && passwordStrength.score < 30) {
        newErrors.password = 'Password is too weak';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Terms validation
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'You must accept the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'acceptTerms' || field === 'newsletter' ? e.target.checked : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Reset username availability when username changes
    if (field === 'username') {
      setUsernameAvailable(null);
    }
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          newsletter: formData.newsletter
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (requireEmailVerification) {
          setEmailSent(true);
        } else {
          onSuccess?.(data.user);
          router.push(`${ROUTES.LOGIN}?message=Registration successful! Please log in.`);
        }
      } else {
        const errorMessage = data.message || 'Registration failed';
        
        // Handle specific field errors
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ email: errorMessage });
        }
        
        onError?.(errorMessage);
        
        // Go back to appropriate step based on error
        if (data.field === 'username' || data.field === 'email') {
          setCurrentStep(1);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setErrors({ email: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social registration
  const handleSocialRegister = (provider: 'google' | 'discord' | 'twitch') => {
    window.location.href = `/api/auth/${provider}/register`;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep === 1) {
      e.preventDefault();
      handleNextStep();
    } else if (e.key === 'Enter' && currentStep === 2 && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Success state after email verification
  if (emailSent) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#4ade80] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
          
          <p className="text-[#768894] mb-6">
            We've sent a verification link to <span className="text-white font-medium">{formData.email}</span>. 
            Click the link in the email to activate your account.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => setEmailSent(false)}
              className="w-full bg-[#2b3d4d] hover:bg-[#374555] text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Back to Registration
            </button>
            
            <Link
              href={ROUTES.LOGIN}
              className="block w-full bg-[#fa4454] hover:bg-[#e03e4e] text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
            >
              Go to Login
            </Link>
          </div>
          
          <p className="text-xs text-[#768894] mt-6">
            Didn't receive the email? Check your spam folder or{' '}
            <button 
              onClick={() => {/* Resend email logic */}}
              className="text-[#fa4454] hover:text-[#e03e4e] transition-colors"
            >
              resend verification email
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6 space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#fa4454] rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Join MRVL.net
          </h2>
          <p className="text-[#768894]">
            Create your account to join the community
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 1 ? 'bg-[#fa4454] text-white' : 'bg-[#2b3d4d] text-[#768894]'
            }`}>
              1
            </div>
            <span className={`text-sm ${currentStep >= 1 ? 'text-white' : 'text-[#768894]'}`}>
              Account Info
            </span>
          </div>
          
          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= 2 ? 'bg-[#fa4454]' : 'bg-[#2b3d4d]'}`} />
          
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= 2 ? 'bg-[#fa4454] text-white' : 'bg-[#2b3d4d] text-[#768894]'
            }`}>
              2
            </div>
            <span className={`text-sm ${currentStep >= 2 ? 'text-white' : 'text-[#768894]'}`}>
              Security
            </span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 pr-12 bg-[#0f1419] border rounded-lg text-white placeholder-[#768894] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:border-transparent ${
                    errors.username ? 'border-[#ef4444]' : 
                    usernameAvailable === true ? 'border-[#4ade80]' :
                    usernameAvailable === false ? 'border-[#ef4444]' :
                    'border-[#2b3d4d] hover:border-[#374555]'
                  }`}
                  placeholder="Choose a unique username"
                  disabled={isLoading}
                  autoComplete="username"
                  spellCheck={false}
                />
                
                {/* Username Status Icon */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {isCheckingUsername ? (
                    <svg className="w-5 h-5 text-[#768894] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : usernameAvailable === true ? (
                    <svg className="w-5 h-5 text-[#4ade80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : usernameAvailable === false ? (
                    <svg className="w-5 h-5 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>
              
              {errors.username ? (
                <p className="mt-2 text-sm text-[#ef4444] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.username}</span>
                </p>
              ) : usernameAvailable === true ? (
                <p className="mt-2 text-sm text-[#4ade80] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Username is available!</span>
                </p>
              ) : usernameAvailable === false ? (
                <p className="mt-2 text-sm text-[#ef4444] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Username is already taken</span>
                </p>
              ) : formData.username.length > 0 && (
                <p className="mt-2 text-xs text-[#768894]">
                  3-20 characters. Letters, numbers, hyphens, and underscores only.
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-[#768894] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:border-transparent ${
                    errors.email ? 'border-[#ef4444]' : 'border-[#2b3d4d] hover:border-[#374555]'
                  }`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                  autoComplete="email"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-[#ef4444] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.email}</span>
                </p>
              )}
              {!errors.email && formData.email && (
                <p className="mt-2 text-xs text-[#768894]">
                  We'll send a verification email to this address.
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!formData.username || !formData.email || isCheckingUsername || usernameAvailable === false}
              className="w-full bg-[#fa4454] hover:bg-[#e03e4e] disabled:bg-[#2b3d4d] disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Password & Terms */}
        {currentStep === 2 && (
          <div className="space-y-6">
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 pr-12 bg-[#0f1419] border rounded-lg text-white placeholder-[#768894] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:border-transparent ${
                    errors.password ? 'border-[#ef4444]' : 'border-[#2b3d4d] hover:border-[#374555]'
                  }`}
                  placeholder="Create a strong password"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#768894] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordStrength && formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#768894]">Password strength:</span>
                    <span className="text-sm font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-[#2b3d4d] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${passwordStrength.score}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    />
                  </div>
                  {passwordStrength.suggestions.length > 0 && (
                    <ul className="mt-2 text-xs text-[#768894] space-y-1">
                      {passwordStrength.suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              {errors.password && (
                <p className="mt-2 text-sm text-[#ef4444] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 pr-12 bg-[#0f1419] border rounded-lg text-white placeholder-[#768894] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:border-transparent ${
                    errors.confirmPassword ? 'border-[#ef4444]' : 
                    formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-[#4ade80]' :
                    'border-[#2b3d4d] hover:border-[#374555]'
                  }`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#768894] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-2 text-sm text-[#ef4444] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.confirmPassword}</span>
                </p>
              ) : formData.confirmPassword && formData.password === formData.confirmPassword ? (
                <p className="mt-2 text-sm text-[#4ade80] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Passwords match!</span>
                </p>
              ) : null}
            </div>

            {/* Terms and Newsletter */}
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange('acceptTerms')}
                  className={`mt-1 w-4 h-4 text-[#fa4454] bg-[#0f1419] border rounded focus:ring-[#fa4454] focus:ring-2 ${
                    errors.acceptTerms ? 'border-[#ef4444]' : 'border-[#2b3d4d]'
                  }`}
                  disabled={isLoading}
                />
                <span className="text-sm text-[#768894]">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#fa4454] hover:text-[#e03e4e] transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-[#fa4454] hover:text-[#e03e4e] transition-colors">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.newsletter}
                  onChange={handleInputChange('newsletter')}
                  className="mt-1 w-4 h-4 text-[#fa4454] bg-[#0f1419] border-[#2b3d4d] rounded focus:ring-[#fa4454] focus:ring-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-[#768894]">
                  Subscribe to our newsletter for updates and esports news
                </span>
              </label>
              
              {errors.acceptTerms && (
                <p className="text-sm text-[#ef4444] flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.acceptTerms}</span>
                </p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="flex-1 bg-[#2b3d4d] hover:bg-[#374555] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !formData.acceptTerms}
                className="flex-1 bg-[#fa4454] hover:bg-[#e03e4e] disabled:bg-[#2b3d4d] disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Social Registration */}
        {showSocialRegister && currentStep === 1 && (
          <div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2b3d4d]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1a2332] text-[#768894]">Or register with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocialRegister('google')}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2 border border-[#2b3d4d] rounded-lg bg-[#0f1419] hover:bg-[#2b3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialRegister('discord')}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2 border border-[#2b3d4d] rounded-lg bg-[#0f1419] hover:bg-[#2b3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialRegister('twitch')}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-2 border border-[#2b3d4d] rounded-lg bg-[#0f1419] hover:bg-[#2b3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-[#9146FF]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Login Link */}
        <div className="text-center pt-4 border-t border-[#2b3d4d]">
          <p className="text-sm text-[#768894]">
            Already have an account?{' '}
            <Link
              href={ROUTES.LOGIN}
              className="text-[#fa4454] hover:text-[#e03e4e] font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 text-center">
        <p className="text-xs text-[#768894]">
          <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs">Enter</kbd> to continue • 
          <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs ml-1">Ctrl</kbd> + 
          <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs ml-1">Enter</kbd> to submit
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
