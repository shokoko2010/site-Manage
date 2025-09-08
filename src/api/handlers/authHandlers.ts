import { authAPI, LoginRequest, RegisterRequest } from '../auth';

// Mock API response handler
export const handleAPIRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // Handle CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Auth routes
    if (path === '/api/auth/register' && method === 'POST') {
      const body = await request.json() as RegisterRequest;
      const result = await authAPI.register(body);
      return jsonResponse(result, 201);
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const body = await request.json() as LoginRequest;
      const result = await authAPI.login(body);
      return jsonResponse(result);
    }

    if (path === '/api/auth/profile' && method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Missing or invalid authorization header', 401);
      }
      const token = authHeader.substring(7);
      const result = await authAPI.getProfile(token);
      return jsonResponse(result);
    }

    if (path === '/api/auth/users' && method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Missing or invalid authorization header', 401);
      }
      const token = authHeader.substring(7);
      const result = await authAPI.getAllUsers(token);
      return jsonResponse(result);
    }

    if (path.startsWith('/api/auth/users/') && method === 'PUT') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Missing or invalid authorization header', 401);
      }
      const token = authHeader.substring(7);
      const userId = path.split('/').pop()!;
      const body = await request.json();
      const result = await authAPI.updateUserPlan(token, userId, body.plan);
      return jsonResponse(result);
    }

    if (path.startsWith('/api/auth/users/') && method === 'DELETE') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Missing or invalid authorization header', 401);
      }
      const token = authHeader.substring(7);
      const userId = path.split('/').pop()!;
      await authAPI.deleteUser(token, userId);
      return jsonResponse({ message: 'User deleted successfully' });
    }

    return errorResponse('Route not found', 404);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
};

const jsonResponse = (data: any, status: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

const errorResponse = (message: string, status: number = 400): Response => {
  return jsonResponse({ error: message }, status);
};