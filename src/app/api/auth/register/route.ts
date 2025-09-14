import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { registerSchema, validateSchema } from '@/lib/validation';
import { ConflictError, withErrorHandling } from '@/lib/errors';
import { signToken } from '@/lib/auth';

async function registerHandler(request: NextRequest) {
  const body = await request.json();
  const validatedData = validateSchema(registerSchema, body);

  const { email, username, password, fullName: name } = validatedData;

  // Check if user already exists
  const existingUser = await db.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    throw new ConflictError('User with this email or username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await db.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      name,
      role: 'USER',
      plan: 'FREE'
    }
  });

  // Generate JWT token
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan
  });

  // Log registration activity
  await db.activity.create({
    data: {
      userId: user.id,
      action: 'LOGIN', // First login after registration
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
  });

  return NextResponse.json({
    message: 'Registration successful',
    token,
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
}

export const POST = withErrorHandling(registerHandler);