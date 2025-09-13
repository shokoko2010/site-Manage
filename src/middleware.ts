import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register', '/api/health'];
  
  // Define protected routes
  const protectedRoutes = ['/appboard', '/content', '/sites', '/analytics', '/settings'];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // If it's a protected route, check for authentication
  if (isProtectedRoute && !isPublicRoute) {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        );
      }
      
      // For page routes, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify token
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (err) {
      // Token is invalid
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // If the user is already authenticated and tries to access login page, redirect to appboard
  if (pathname === '/login' || pathname === '/register') {
    const token = request.cookies.get('auth_token')?.value;
    
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        return NextResponse.redirect(new URL('/appboard', request.url));
      } catch (err) {
        // Token is invalid, continue to login page
      }
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;");
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};