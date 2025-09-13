import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { withErrorHandling } from '@/lib/errors';

async function logoutHandler() {
  const response = NextResponse.json({
    message: 'Logout successful'
  });

  // Clear the auth token cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });

  return response;
}

export const POST = withErrorHandling(logoutHandler);