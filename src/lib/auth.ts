import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  plan: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token and return payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw error;
  }
}

/**
 * Sign JWT token with payload
 */
export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Extract token from request headers or cookies
 */
export function extractToken(request: Request): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from cookies (for Next.js API routes)
  // Note: This won't work in all contexts, adjust as needed
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.auth_token) {
      return cookies.auth_token;
    }
  }

  return null;
}

/**
 * Middleware to verify authentication
 */
export function requireAuth(request: Request): JwtPayload {
  const token = extractToken(request);
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  return verifyToken(token);
}

/**
 * Check if user has required role
 */
export function requireRole(payload: JwtPayload, requiredRoles: string | string[]): void {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  if (!roles.includes(payload.role)) {
    throw new Error('Insufficient permissions');
  }
}

/**
 * Check if user has required plan
 */
export function requirePlan(payload: JwtPayload, requiredPlans: string | string[]): void {
  const plans = Array.isArray(requiredPlans) ? requiredPlans : [requiredPlans];
  
  if (!plans.includes(payload.plan)) {
    throw new Error('Upgrade required');
  }
}