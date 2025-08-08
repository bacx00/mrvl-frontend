'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Username validation
    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }
    
    // Confirm password validation
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms agreement
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Try API registration first
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password
        })
      });

      if (response.ok) {
        const { user, token } = await response.json();
        const completeUser = {
          id: user.id || `user-${Date.now()}`,
          username: user.username || form.username,
          email: user.email || form.email,
          role: user.role || 'user',
          avatar: user.avatar || '/avatars/default.png',
          posts: user.posts || 0,
          joinDate: user.joinDate || new Date().toISOString()
        };
        login(completeUser, token);
        router.push('/');
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      // Mock registration for development
      console.warn('Using mock registration for development');
      const mockUser = {
        id: `user-${Date.now()}`,
        username: form.username,
        email: form.email,
        role: 'user' as const,
        avatar: '/avatars/default.png',
        posts: 0,
        joinDate: new Date().toISOString()
      };
      login(mockUser, `mock-token-${Date.now()}`);
      router.push('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0f1419] min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join MRVL</h1>
            <p className="text-[#768894]">Create your Marvel Rivals esports account</p>
          </div>

          {/* Registration Form */}
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 bg-[#0f1419] border rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors ${
                    errors.username ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-[#fa4454]">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 bg-[#0f1419] border rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors ${
                    errors.email ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-[#fa4454]">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 bg-[#0f1419] border rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors ${
                    errors.password ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-[#fa4454]">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-[#768894]">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 bg-[#0f1419] border rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors ${
                    errors.confirmPassword ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-[#fa4454]">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className={`mt-1 w-4 h-4 bg-[#0f1419] border rounded focus:ring-[#fa4454] text-[#fa4454] ${
                      errors.terms ? 'border-[#fa4454]' : 'border-[#2b3d4d]'
                    }`}
                  />
                  <span className="ml-2 text-sm text-[#768894]">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#fa4454] hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-[#fa4454] hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-[#fa4454]">{errors.terms}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded font-medium text-white transition-all ${
                  isSubmitting
                    ? 'bg-[#8a3039] cursor-not-allowed'
                    : 'bg-[#fa4454] hover:bg-[#e03a49] active:bg-[#d12c3c]'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-[#768894]">
              Already have an account?{' '}
              <Link href="/user/login" className="text-[#fa4454] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
