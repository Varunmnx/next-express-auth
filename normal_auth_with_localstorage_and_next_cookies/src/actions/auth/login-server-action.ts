'use server'
import { CookieKeys } from '@/lib/constants';
import { cookies } from 'next/headers'; 


interface LoginResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    console.log(process.env.NEXT_PUBLIC_API_URL)
    // Make a direct API call to your authentication endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    console.log(response)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'Authentication failed',
      };
    }

    const data = await response.json();
    
    // Set cookies if needed
    const cookieStore = await cookies();
    if (data.token) {
      cookieStore.set(CookieKeys.AUTH_TOKEN, data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
    }
    
    if (data.refreshToken) {
      cookieStore.set(CookieKeys.REFRESH_TOKEN, data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return { 
      success: true,
      redirectUrl: '/home'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Failed to connect to authentication service',
    };
  }
}

// For development/testing only
export async function mockLogin(username: string, password: string): Promise<LoginResult> {
  // IMPORTANT: This is only for development/testing
  // In a real application, never hardcode credentials
  if (username === 'admin' && password === 'password123') {
    // Set mock cookies
    const cookieStore = await cookies();
    
    // Create a mock token
    const mockToken = 'mock-jwt-token-for-testing-purposes-only';
    const mockRefreshToken = 'mock-refresh-token-for-testing-purposes-only';
    
    cookieStore.set(CookieKeys.AUTH_TOKEN, mockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    cookieStore.set(CookieKeys.REFRESH_TOKEN, mockRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    
    return { 
      success: true,
      redirectUrl: '/home'
    };
  }
  
  return {
    success: false,
    error: 'Invalid username or password',
  };
}