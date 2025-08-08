import { NextRequest, NextResponse } from 'next/server';

// Backend API configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for security logging
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Parse request body
    const body = await request.json();
    const { token, email, password, password_confirmation } = body;

    // Validation
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Reset token is required' 
        }, 
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Email address is required' 
        }, 
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Password is required' 
        }, 
        { status: 400 }
      );
    }

    if (password !== password_confirmation) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Passwords do not match' 
        }, 
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Password must be at least 6 characters long' 
        }, 
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Please enter a valid email address' 
        }, 
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Forwarded-For': clientIp,
      },
      body: JSON.stringify({
        token,
        email,
        password,
        password_confirmation
      })
    });

    const responseData = await backendResponse.json();

    // Log security event (without password)
    console.log(`[SECURITY] ${new Date().toISOString()} - PASSWORD_RESET_ATTEMPT:`, {
      email,
      tokenPresent: !!token,
      ip: clientIp,
      success: backendResponse.ok,
      status: backendResponse.status
    });

    if (backendResponse.ok) {
      return NextResponse.json({
        success: true,
        message: responseData.message || 'Password reset successfully'
      });
    } else {
      // Return actual error for password reset (user needs to know if token is invalid/expired)
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || 'Failed to reset password. The reset link may be invalid or expired.'
        },
        { status: backendResponse.status }
      );
    }

  } catch (error) {
    console.error('Reset password error:', error);
    
    // Log security event
    console.log(`[SECURITY] ${new Date().toISOString()} - PASSWORD_RESET_ERROR:`, {
      error: error.message,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred while resetting your password. Please try again.'
      }, 
      { status: 500 }
    );
  }
}