'use server';

import { CookieKeys } from '@/lib/constants';
import { cookies } from 'next/headers';

type LoginResult = {
  success: boolean;
  error?: string;
};

export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    // Make API call to your authentication endpoint
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Authentication failed',
      };
    }
    console.log("====> Server Action ====>",data)
    // If login was successful, set the JWT token in an HTTP-only cookie
    const { access_token, refresh_token } = data;
    const cookieStorage = await cookies();
    // Set the auth token cookie
    console.log("access token",access_token)
    cookieStorage.set({
      name: CookieKeys.AUTH_TOKEN,
      value: access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    // Set the refresh token cookie
    cookieStorage.set({
      name: CookieKeys.REFRESH_TOKEN,
      value: refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Failed to connect to authentication service',
    };
  }
}

// For development/testing purposes only
export async function mockLogin(username: string, password: string): Promise<LoginResult> {
  // IMPORTANT: This is only for development/testing
  // In a real application, never hardcode credentials
  if (username === 'admin' && password === 'password123') {
    // Mock JWT token (in a real app, this would come from your auth service)
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNjE2MTQ4MzY1LCJleHAiOjE2MTYyMzQ3NjV9.mocked-signature';
    const cookieStorage = await cookies();
    cookieStorage.set({
      name: CookieKeys.AUTH_TOKEN,
      value: mockToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    return { success: true };
  }
  
  return {
    success: false,
    error: 'Invalid username or password',
  };
}