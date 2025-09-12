import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/register', '/api/health'];
  
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
  
  // If it's a protected route, check for authentication token
  if (isProtectedRoute && !isPublicRoute) {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // For API routes, check the token
    if (pathname.startsWith('/api/') && !token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }
    
    // For page routes, we'll let the client-side handle authentication
    // The ProtectedRoute component will check authentication
  }
  
  // If the user is already authenticated and tries to access login page, redirect to appboard
  if (pathname === '/login') {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (token) {
      return NextResponse.redirect(new URL('/appboard', request.url));
    }
  }
  
  return NextResponse.next();
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