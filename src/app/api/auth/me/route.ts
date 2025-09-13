import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthenticationError, handleApiError, withErrorHandling } from '@/lib/errors';
import { verifyToken } from '@/lib/auth';

async function getMeHandler(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    throw new AuthenticationError('No authentication token found');
  }

  // Verify token
  const decoded = verifyToken(token);

  // Get user from database
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      plan: true,
      avatar: true,
      bio: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError('User not found or inactive');
  }

  return NextResponse.json({
    user
  });
}

export const GET = withErrorHandling(getMeHandler);