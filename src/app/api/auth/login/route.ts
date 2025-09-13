import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { loginSchema, validateSchema } from '@/lib/validation';
import { AuthenticationError, withErrorHandling } from '@/lib/errors';
import { signToken } from '@/lib/auth';

async function loginHandler(request: NextRequest) {
  const body = await request.json();
  const { email, password } = validateSchema(loginSchema, body);

  // Find user by email
  const user = await db.user.findUnique({
    where: { email }
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Generate JWT token
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan
  });

  // Log login activity
  await db.activity.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
  });

  // Create response with HTTP-only cookie
  const response = NextResponse.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
      plan: user.plan,
      avatar: user.avatar,
      bio: user.bio
    }
  });

  // Set HTTP-only cookie
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  return response;
}

export const POST = withErrorHandling(loginHandler);