import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  referralCode: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string(),
    ip: z.string(),
    deviceType: z.enum(['mobile', 'desktop', 'tablet'])
  }).optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Mock database - Replace with your actual database
let users = [
  { 
    id: 1,
    username: 'admin', 
    email: 'admin@mrvl.net',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYKHYOTjL8YB9JlK9ZqK9ZqK9ZqK9ZqK',
    role: 'admin',
    isVerified: true,
    verificationToken: null,
    createdAt: new Date('2025-01-01'),
    lastLogin: null,
    profile: {
      bio: '',
      country: '',
      favoriteTeam: '',
      avatar: '/default-avatar.png'
    }
  }
];

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const EMAIL_VERIFICATION_SECRET = process.env.EMAIL_VERIFICATION_SECRET || 'your-email-verification-secret';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  referralCode?: string;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
  };
}

// Security and spam prevention
const registrationAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_REGISTRATIONS_PER_IP = 3;
const REGISTRATION_WINDOW = 60 * 60 * 1000; // 1 hour

// Disposable email domains (basic list)
const disposableEmailDomains = [
  '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', 'temp-mail.org', 'throwaway.email', 'getnada.com'
];

// Security logging
function logSecurityEvent(event: string, details: any) {
  console.log(`[SECURITY] ${new Date().toISOString()} - ${event}:`, details);
}

// Check for spam/abuse
function checkRegistrationLimits(ip: string): boolean {
  const now = new Date();
  const attempts = registrationAttempts.get(ip);

  if (!attempts) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if window has passed
  if (now.getTime() - attempts.lastAttempt.getTime() > REGISTRATION_WINDOW) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Check if limit exceeded
  if (attempts.count >= MAX_REGISTRATIONS_PER_IP) {
    return false;
  }

  // Increment counter
  attempts.count += 1;
  attempts.lastAttempt = now;
  return true;
}

// Check if email is disposable
function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableEmailDomains.includes(domain);
}

// Generate verification token
function generateVerificationToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, type: 'email_verification' },
    EMAIL_VERIFICATION_SECRET,
    { expiresIn: '24h', issuer: 'mrvl.net' }
  );
}

// Send welcome email (mock function)
async function sendWelcomeEmail(user: any, verificationToken: string) {
  const verificationLink = `${process.env.BASE_URL || 'https://mrvl.net'}/verify-email?token=${verificationToken}`;
  
  console.log(`[EMAIL] Welcome email sent to ${user.email}`);
  console.log(`[EMAIL] Verification link: ${verificationLink}`);
  
  // In production, integrate with your email service (SendGrid, AWS SES, etc.)
  // Example:
  // await emailService.send({
  //   to: user.email,
  //   subject: 'Welcome to MRVL.net - Verify Your Account',
  //   template: 'welcome',
  //   data: { username: user.username, verificationLink }
  // });
}

// Check username availability
async function isUsernameAvailable(username: string): Promise<boolean> {
  return !users.some(u => u.username.toLowerCase() === username.toLowerCase());
}

// Check email availability
async function isEmailAvailable(email: string): Promise<boolean> {
  return !users.some(u => u.email.toLowerCase() === email.toLowerCase());
}

// Process referral code
function processReferralCode(referralCode: string) {
  // Mock referral processing
  const referrer = users.find(u => u.username === referralCode);
  if (referrer) {
    console.log(`[REFERRAL] New user referred by ${referrer.username}`);
    return { valid: true, referrerId: referrer.id };
  }
  return { valid: false, referrerId: null };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for spam prevention
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Check registration limits
    if (!checkRegistrationLimits(clientIp)) {
      logSecurityEvent('REGISTRATION_RATE_LIMITED', { ip: clientIp });
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body: RegisterRequest = await request.json();
    
    try {
      registerSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors = validationError.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logSecurityEvent('REGISTRATION_VALIDATION_ERROR', { 
          ip: clientIp, 
          errors 
        });
        
        return NextResponse.json(
          { error: 'Validation failed', details: errors },
          { status: 400 }
        );
      }
    }

    const { username, email, password, referralCode, deviceInfo } = body;

    // Check for disposable email
    if (isDisposableEmail(email)) {
      logSecurityEvent('REGISTRATION_DISPOSABLE_EMAIL', { 
        ip: clientIp, 
        email: email.split('@')[1] 
      });
      return NextResponse.json(
        { error: 'Please use a valid email address' },
        { status: 400 }
      );
    }

    // Check username availability
    if (!(await isUsernameAvailable(username))) {
      logSecurityEvent('REGISTRATION_USERNAME_TAKEN', { 
        ip: clientIp, 
        username 
      });
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Check email availability
    if (!(await isEmailAvailable(email))) {
      logSecurityEvent('REGISTRATION_EMAIL_TAKEN', { 
        ip: clientIp, 
        email: email.split('@')[0] + '@***' 
      });
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Process referral if provided
    let referralInfo = null;
    if (referralCode) {
      referralInfo = processReferralCode(referralCode);
    }

    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      isVerified: false,
      verificationToken: null,
      createdAt: new Date(),
      lastLogin: null,
      profile: {
        bio: '',
        country: '',
        favoriteTeam: '',
        avatar: '/default-avatar.png'
      },
      referredBy: referralInfo?.referrerId || null,
      registrationIp: clientIp,
      deviceInfo: deviceInfo || null
    };

    // Generate verification token
    const verificationToken = generateVerificationToken(newUser.id, email);
    newUser.verificationToken = verificationToken;

    // Add user to database
    users.push(newUser);

    // Send welcome email
    await sendWelcomeEmail(newUser, verificationToken);

    // Log successful registration
    logSecurityEvent('REGISTRATION_SUCCESS', {
      userId: newUser.id,
      username: newUser.username,
      email: email.split('@')[0] + '@***',
      ip: clientIp,
      hasReferral: !!referralCode
    });

    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt
      },
      requiresVerification: true
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    logSecurityEvent('REGISTRATION_ERROR', { error: error.message });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Username availability check endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const email = searchParams.get('email');

    if (username) {
      const available = await isUsernameAvailable(username);
      return NextResponse.json({ available, username });
    }

    if (email) {
      const available = await isEmailAvailable(email);
      return NextResponse.json({ available, email: email.split('@')[0] + '@***' });
    }

    return NextResponse.json(
      { error: 'Username or email parameter required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Email verification endpoint
export async function PUT(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, EMAIL_VERIFICATION_SECRET) as any;
    } catch (error) {
      logSecurityEvent('EMAIL_VERIFICATION_INVALID_TOKEN', { token: token.substring(0, 10) + '...' });
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Find user and verify
    const userIndex = users.findIndex(u => u.id === decoded.userId && u.email === decoded.email);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user verification status
    users[userIndex].isVerified = true;
    users[userIndex].verificationToken = null;

    logSecurityEvent('EMAIL_VERIFICATION_SUCCESS', {
      userId: users[userIndex].id,
      username: users[userIndex].username
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
