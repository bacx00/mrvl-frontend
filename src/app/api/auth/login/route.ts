import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Mock database - Replace with your actual database
const users = [
  { 
    id: 1,
    username: 'admin', 
    email: 'admin@mrvl.net',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYKHYOTjL8YB9JlK9ZqK9ZqK9ZqK9ZqK', // adminpass
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2025-01-01'),
    lastLogin: null
  },
  { 
    id: 2,
    username: 'editor', 
    email: 'editor@mrvl.net',
    password: '$2a$12$8EXAMPLE8HASH8FOR8EDITOR8PASSWORD8', // editorpass
    role: 'editor',
    isVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2025-01-01'),
    lastLogin: null
  },
  { 
    id: 3,
    username: 'testuser', 
    email: 'user@mrvl.net',
    password: '$2a$12$9EXAMPLE9HASH9FOR9USER9PASSWORD9', // userpass
    role: 'user',
    isVerified: true,
    twoFactorEnabled: false,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2025-01-01'),
    lastLogin: null
  }
];

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lockUntil: Date | null;
  createdAt: Date;
  lastLogin: Date | null;
}

// Security logging function
function logSecurityEvent(event: string, details: any) {
  console.log(`[SECURITY] ${new Date().toISOString()} - ${event}:`, details);
  // In production, send to your logging service (Winston, DataDog, etc.)
}

// Generate JWT tokens
function generateTokens(user: User, rememberMe: boolean = false) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'mrvl.net',
    audience: 'mrvl-users'
  });

  const refreshToken = jwt.sign(
    { userId: user.id }, 
    JWT_SECRET, 
    { 
      expiresIn: rememberMe ? '30d' : REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'mrvl.net',
      audience: 'mrvl-refresh'
    }
  );

  return { accessToken, refreshToken };
}

// Validate password strength
function validatePassword(password: string): boolean {
  return password.length >= 6; // Basic validation - enhance as needed
}

// Check if account is locked
function isAccountLocked(user: User): boolean {
  return user.lockUntil !== null && user.lockUntil > new Date();
}

// Handle failed login attempt
function handleFailedLogin(user: User): User {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  user.loginAttempts += 1;

  if (user.loginAttempts >= maxAttempts) {
    user.lockUntil = new Date(Date.now() + lockTime);
    logSecurityEvent('ACCOUNT_LOCKED', { 
      userId: user.id, 
      username: user.username,
      attempts: user.loginAttempts 
    });
  }

  return user;
}

// Reset login attempts on successful login
function resetLoginAttempts(user: User): User {
  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLogin = new Date();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for security logging
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Parse request body
    const body: LoginRequest = await request.json();
    const { username, email, password, rememberMe = false, deviceInfo } = body;

    // Validation
    if (!password) {
      logSecurityEvent('LOGIN_ATTEMPT_NO_PASSWORD', { ip: clientIp });
      return NextResponse.json(
        { error: 'Password is required' }, 
        { status: 400 }
      );
    }

    if (!username && !email) {
      logSecurityEvent('LOGIN_ATTEMPT_NO_IDENTIFIER', { ip: clientIp });
      return NextResponse.json(
        { error: 'Username or email is required' }, 
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = users.find(u => 
      u.username === username || u.email === email
    );

    if (!user) {
      logSecurityEvent('LOGIN_ATTEMPT_USER_NOT_FOUND', { 
        username, 
        email, 
        ip: clientIp 
      });
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      logSecurityEvent('LOGIN_ATTEMPT_ACCOUNT_LOCKED', { 
        userId: user.id, 
        username: user.username,
        ip: clientIp 
      });
      return NextResponse.json(
        { error: 'Account is temporarily locked due to too many failed attempts' }, 
        { status: 423 }
      );
    }

    // Check if account is verified
    if (!user.isVerified) {
      logSecurityEvent('LOGIN_ATTEMPT_UNVERIFIED', { 
        userId: user.id, 
        username: user.username,
        ip: clientIp 
      });
      return NextResponse.json(
        { 
          error: 'Please verify your email address before logging in',
          requiresVerification: true,
          email: user.email
        }, 
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      handleFailedLogin(user);
      logSecurityEvent('LOGIN_ATTEMPT_WRONG_PASSWORD', { 
        userId: user.id, 
        username: user.username,
        attempts: user.loginAttempts,
        ip: clientIp 
      });
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    resetLoginAttempts(user);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, rememberMe);

    // Log successful login
    logSecurityEvent('LOGIN_SUCCESS', { 
      userId: user.id, 
      username: user.username,
      ip: clientIp,
      deviceInfo: deviceInfo || 'unknown',
      rememberMe
    });

    // Prepare response data
    const responseData = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    };

    // Create response with secure cookies
    const response = NextResponse.json(responseData);

    // Set secure HTTP-only cookies
    response.cookies.set('mrvl_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    response.cookies.set('mrvl_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    logSecurityEvent('LOGIN_ERROR', { error: error.message });
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle logout (clear cookies)
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear authentication cookies
    response.cookies.delete('mrvl_access_token');
    response.cookies.delete('mrvl_refresh_token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Token refresh endpoint
export async function PUT(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('mrvl_refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' }, 
        { status: 401 }
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 401 }
      );
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    const response = NextResponse.json({
      success: true,
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_EXPIRES_IN
      }
    });

    // Update cookies
    response.cookies.set('mrvl_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('mrvl_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Invalid refresh token' }, 
      { status: 401 }
    );
  }
}
