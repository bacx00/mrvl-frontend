'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    token: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Get token and email from URL parameters
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (token && email) {
      setForm(prev => ({
        ...prev,
        token: token,
        email: decodeURIComponent(email)
      }));
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate passwords match
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#0f1419] min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Password Reset Successful</h1>
              <p className="text-[#768894]">Your password has been updated successfully</p>
            </div>

            {/* Success Message */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#2a5f3a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">All Set!</h2>
                <p className="text-[#768894] mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                
                <Link 
                  href="/user/login" 
                  className="block w-full py-3 px-4 bg-[#fa4454] hover:bg-[#e03a49] rounded font-medium text-white text-center transition-colors"
                >
                  Sign In Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1419] min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
            <p className="text-[#768894]">Enter your new password below</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-[#331419] border border-[#fa4454] rounded p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#fa4454] mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-white text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Reset Password Form */}
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full px-3 py-3 bg-[#0f1419] border border-[#2b3d4d] rounded text-[#768894] cursor-not-allowed"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-3 pr-10 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#768894] hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-xs text-[#768894]">
                  Password must contain at least 6 characters with uppercase, lowercase, and numbers
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-3 pr-10 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#768894] hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !form.token}
                className={`w-full py-3 px-4 rounded font-medium text-white transition-all ${
                  isLoading || !form.token
                    ? 'bg-[#8a3039] cursor-not-allowed'
                    : 'bg-[#fa4454] hover:bg-[#e03a49] active:bg-[#d12c3c]'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#768894]">
                Remember your password?{' '}
                <Link href="/user/login" className="text-[#fa4454] hover:underline">
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#768894]">
              For your security, this reset link will expire in 60 minutes and can only be used once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#0f1419] min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}