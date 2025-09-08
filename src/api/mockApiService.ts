// Mock API service to simulate backend endpoints
import { handleAPIRequest } from './handlers/authHandlers';

// Create a mock fetch function that intercepts API calls
export const createMockFetch = (originalFetch: typeof fetch) => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only intercept API calls
    if (url.startsWith('/api/')) {
      const request = new Request(url, init);
      return handleAPIRequest(request);
    }
    
    // For non-API calls, use the original fetch
    return originalFetch(input, init);
  };
};

// Initialize mock API service
export const initializeMockApi = () => {
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = createMockFetch(originalFetch);
  }
};