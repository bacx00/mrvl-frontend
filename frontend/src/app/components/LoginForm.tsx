// src/components/LoginForm.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/constants';

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showSocialLogin?: boolean;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  compact?: boolean;
  className?: string;
}

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  redirectTo,
  onSuccess,
  onError,
  showSocialLogin = true,
  showRememberMe = true,
  showForgotPassword = true,
  compact = false,
  className = ''
}) => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus username field on mount
  useEffect(() => {
    if (usernameRef.current && !compact) {
      usernameRef.current.focus();
    }
  }, [compact]);

  // Handle redirect parameter from URL
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect && !redirectTo) {
      // Store redirect URL for after login
    }
  }, [searchParams, redirectTo]);

  // Handle account lockout timer
  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      lockTimerRef.current = setTimeout(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }
    };
  }, [isLocked, lockTimeRemaining]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) return;
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Successful login
        const user = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role || 'user',
          avatar: data.user.avatar,
          posts: data.user.posts || 0,
          joinDate: data.user.joinDate
        };

        login(user, data.token);
        
        // Reset attempts on successful login
        setLoginAttempts(0);
        
        onSuccess?.();
        
        // Redirect
        const redirect = redirectTo || searchParams.get('redirect') || ROUTES.HOME;
        router.push(redirect);
        
      } else {
        // Failed login
        const attempts = loginAttempts + 1;
        setLoginAttempts(attempts);
        
        // Lock account after 5 failed attempts
        if (attempts >= 5) {
          setIsLocked(true);
          setLockTimeRemaining(300); // 5 minutes
          setErrors({ username: 'Account temporarily locked due to multiple failed attempts' });
        } else {
          setErrors({ 
            username: data.message || 'Invalid username or password',
            password: ' ' // Show error styling on password field too
          });
        }
        
        onError?.(data.message || 'Login failed');
        
        // Clear password field
        setFormData(prev => ({ ...prev, password: '' }));
        passwordRef.current?.focus();
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setErrors({ username: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = (provider: 'google' | 'discord' | 'twitch') => {
    window.location.href = `/api/auth/${provider}?redirect=${encodeURIComponent(redirectTo || ROUTES.HOME)}`;
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    router.push(`${ROUTES.FORGOT_PASSWORD}?email=${encodeURIComponent(formData.username)}`);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6 space-y-6">
        
        {/* Header */}
        {!compact && (
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#fa4454] rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-[#768894]">
              Sign in to your MRVL.net account
            </p>
          </div>
        )}
        
        {/* Account Lockout Warning */}
        {isLocked && (
          <div className="bg-[#ef4444]/20 border border-[#ef4444] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-[#ef4444] mb-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">Account Temporarily Locked</span>
            </div>
            <p className="text-sm text-[#ef4444]">
              Too many failed login attempts. Try again in {Math.floor(lockTimeRemaining / 60)}:
              {(lockTimeRemaining % 60).toString().padStart(2, '0')}
            </p>
          </div>
        )}
        
        {/* Login Attempts Warning */}
        {loginAttempts > 2 && !isLocked && (
          <div className="bg-[#f59e0b]/20 border border-[#f59e0b] rounded-lg p-3 text-center">
            <p className="text-sm text-[#f59e0b]">
              {5 - loginAttempts} attempts remaining before account lock
            </p>
          </div>
        )}
        
        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
            Username or Email
          </label>
          <div className="relative">
            <input
              ref={usernameRef}
              id="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange('username')}
              onKeyDown={handleKeyDown}
              className={`w-full px-4 py-3 bg-[#0f1419] border rounded-lg text-white placeholder-[#768894] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:border-transparent ${
                errors.username ? 'border-[#ef4444]' : 'border-[#2b3d4d] hover:border-[#374555]'
              }`}
              placeholder="Enter your username or email"
              disabled={isLoading || isLocked}
              autoComplete="username"
              spellCheck={false}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-[#ef4444] flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errors.username}</span>
            </p>
          )}
        </div>
        
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
              placeholder="Enter your password"
              disabled={isLoading || isLocked}
              autoComplete="current-password"
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
          {errors.password && errors.password.trim() && (
            <p className="mt-2 text-sm text-[#ef4444] flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errors.password}</span>
            </p>
          )}
        </div>
        
        {/* Remember Me & Forgot Password */}
        {(showRememberMe || showForgotPassword) && (
          <div className="flex items-center justify-between">
            {showRememberMe && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange('rememberMe')}
                  className="w-4 h-4 text-[#fa4454] bg-[#0f1419] border-[#2b3d4d] rounded focus:ring-[#fa4454] focus:ring-2"
                  disabled={isLoading || isLocked}
                />
                <span className="text-sm text-[#768894]">Remember me</span>
              </label>
            )}
            
            {showForgotPassword && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#fa4454] hover:text-[#e03e4e] transition-colors"
                disabled={isLoading || isLocked}
              >
                Forgot password?
              </button>
            )}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isLocked}
          className="w-full bg-[#fa4454] hover:bg-[#e03e4e] disabled:bg-[#2b3d4d] disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </>
          ) : isLocked ? (
            'Account Locked'
          ) : (
            'Sign In'
          )}
        </button>
        
        {/* Social Login */}
        {showSocialLogin && !compact && (
          <div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2b3d4d]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1a2332] text-[#768894]">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || isLocked}
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
                onClick={() => handleSocialLogin('discord')}
                disabled={isLoading || isLocked}
                className="flex items-center justify-center px-4 py-2 border border-[#2b3d4d] rounded-lg bg-[#0f1419] hover:bg-[#2b3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialLogin('twitch')}
                disabled={isLoading || isLocked}
                className="flex items-center justify-center px-4 py-2 border border-[#2b3d4d] rounded-lg bg-[#0f1419] hover:bg-[#2b3d4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-[#9146FF]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Register Link */}
        <div className="text-center pt-4 border-t border-[#2b3d4d]">
          <p className="text-sm text-[#768894]">
            Don't have an account?{' '}
            <Link
              href={ROUTES.REGISTER}
              className="text-[#fa4454] hover:text-[#e03e4e] font-medium transition-colors"
            >
              Create one here
            </Link>
          </p>
          
          {!compact && (
            <p className="text-xs text-[#768894] mt-2">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-[#fa4454] hover:text-[#e03e4e] transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#fa4454] hover:text-[#e03e4e] transition-colors">
                Privacy Policy
              </Link>
            </p>
          )}
        </div>
      </form>
      
      {/* Keyboard Shortcuts Help */}
      {!compact && (
        <div className="mt-4 text-center">
          <p className="text-xs text-[#768894]">
            <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs">Ctrl</kbd> + 
            <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs ml-1">Enter</kbd> to submit quickly
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
