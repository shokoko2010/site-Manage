// server-vercel.ts - Vercel-compatible serverless entry point
// This file is for Vercel deployment - it removes the custom server setup

// Note: For Vercel deployment, we don't need a custom server
// Vercel will automatically handle the Next.js app routing
// Socket.IO will be handled through API routes

console.log('Vercel serverless environment detected');
console.log('Custom server disabled - using Vercel serverless functions');

// Export empty function to satisfy module requirements
export default function handler() {
  // This function is not used in Vercel deployment
  // Vercel handles the routing automatically
  return null;
}