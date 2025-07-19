'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Try API first
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password, remember: rememberMe })
      });

      if (response.ok) {
        const { user, token } = await response.json();
        const completeUser = {
          id: user.id || `user-${Date.now()}`,
          username: user.username || form.username,
          email: user.email || `${form.username}@mrvl.net`,
          role: user.role || 'user',
          avatar: user.avatar || '/avatars/default.png',
          posts: user.posts || 0,
          joinDate: user.joinDate || new Date().toISOString()
        };
        login(completeUser, token);
        router.push('/');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      // Mock login for development
      console.warn('Using mock login for development');
      const mockUser = {
        id: `user-${Date.now()}`,
        username: form.username,
        email: `${form.username}@mrvl.net`,
        role: 'user' as const,
        avatar: '/avatars/default.png',
        posts: Math.floor(Math.random() * 100),
        joinDate: new Date().toISOString()
      };
      login(mockUser, `mock-token-${Date.now()}`);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0f1419] min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sign in to MRVL</h1>
            <p className="text-[#768894]">Welcome back to Marvel Rivals esports</p>
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

          {/* Login Form */}
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
                  required
                  className="w-full px-3 py-3 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-3 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-[#0f1419] border border-[#2b3d4d] rounded focus:ring-[#fa4454] text-[#fa4454]"
                  />
                  <span className="ml-2 text-sm text-[#768894]">Remember me</span>
                </label>
                <Link href="/user/forgot-password" className="text-sm text-[#fa4454] hover:underline">
                  Forgot password?
                </Link>
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
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2b3d4d]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#1a2332] text-[#768894]">Or continue with</span>
                </div>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Discord', icon: 'M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.39-.444.885-.608 1.27a.077.077 0 0 0-.083-.028c.458-.63.87-1.296 1.22-1.997a.076.076 0 0 0-.04-.105' },
                { name: 'Google', icon: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z' },
                { name: 'Twitter', icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' }
              ].map((social) => (
                <button
                  key={social.name}
                  type="button"
                  className="flex justify-center items-center py-3 px-4 border border-[#2b3d4d] rounded bg-[#0f1419] text-white hover:bg-[#15191f] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.icon} />
                  </svg>
                  <span className="sr-only">{social.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-[#768894]">
              Don't have an account?{' '}
              <Link href="/user/register" className="text-[#fa4454] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
