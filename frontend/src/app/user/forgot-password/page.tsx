'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
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
              <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
              <p className="text-[#768894]">We've sent password reset instructions to your email</p>
            </div>

            {/* Success Message */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#2a5f3a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Email Sent!</h2>
                <p className="text-[#768894] mb-6">
                  We've sent a password reset link to <strong className="text-white">{email}</strong>
                </p>
                <p className="text-sm text-[#768894] mb-6">
                  If you don't see the email in your inbox, please check your spam folder. The link will expire in 60 minutes.
                </p>
                
                {/* Resend Button */}
                <button
                  onClick={() => {setSuccess(false); setEmail('');}}
                  className="w-full py-2 px-4 border border-[#2b3d4d] rounded text-[#768894] hover:text-white hover:border-[#fa4454] transition-colors mb-4"
                >
                  Send Another Reset Email
                </button>

                {/* Back to Login */}
                <Link 
                  href="/user/login" 
                  className="block w-full py-3 px-4 bg-[#fa4454] hover:bg-[#e03a49] rounded font-medium text-white text-center transition-colors"
                >
                  Back to Sign In
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
            <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
            <p className="text-[#768894]">Enter your email address and we'll send you a link to reset your password</p>
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

          {/* Forgot Password Form */}
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-3 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded font-medium text-white transition-all ${
                  isLoading
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
                    Sending Reset Link...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#768894] mb-4">
                Remember your password?{' '}
                <Link href="/user/login" className="text-[#fa4454] hover:underline">
                  Back to Sign In
                </Link>
              </p>
              
              <div className="border-t border-[#2b3d4d] pt-4">
                <p className="text-xs text-[#768894]">
                  If you're having trouble accessing your account, contact our support team at{' '}
                  <a href="mailto:support@mrvl.net" className="text-[#fa4454] hover:underline">
                    support@mrvl.net
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#768894]">
              For security reasons, we don't disclose whether an email address is registered with us.
              If you don't receive an email, please check your spam folder or try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}