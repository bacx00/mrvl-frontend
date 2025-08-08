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
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Email address is required' 
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
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Forwarded-For': clientIp,
      },
      body: JSON.stringify({ email })
    });

    const responseData = await backendResponse.json();

    // Log security event
    console.log(`[SECURITY] ${new Date().toISOString()} - PASSWORD_RESET_REQUEST:`, {
      email,
      ip: clientIp,
      success: backendResponse.ok,
      status: backendResponse.status
    });

    if (backendResponse.ok) {
      return NextResponse.json({
        success: true,
        message: responseData.message || 'Password reset link sent successfully'
      });
    } else {
      // For security reasons, always return success message to prevent email enumeration
      // But log the actual error for debugging
      console.log(`[SECURITY] Password reset failed for ${email}:`, responseData);
      
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Log security event
    console.log(`[SECURITY] ${new Date().toISOString()} - PASSWORD_RESET_ERROR:`, {
      error: error.message,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // For security reasons, don't expose internal errors
    return NextResponse.json(
      { 
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      }, 
      { status: 200 }
    );
  }
}