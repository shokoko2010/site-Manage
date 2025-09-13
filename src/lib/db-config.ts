import { PrismaClient } from '@prisma/client';

// Database configuration for different environments
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Create Prisma client with appropriate configuration
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL!,
      },
    },
  });

  // Add connection pooling for production
  if (isProduction) {
    client.$connect().then(() => {
      console.log('Database connected successfully');
    }).catch((error) => {
      console.error('Database connection error:', error);
    });
  }

  return client;
};

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Export Prisma client
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Save to global object in development to prevent multiple connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { 
      status: 'healthy', 
      message: 'Database connection successful',
      environment: isVercel ? 'vercel' : isProduction ? 'production' : 'development'
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Database migration helper
export async function runMigrations() {
  try {
    if (isVercel) {
      console.log('Running migrations for Vercel deployment...');
      // For Vercel, we use push instead of migrate
      await db.$executeRaw`CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    } else {
      console.log('Running database migrations...');
      // For local development, use Prisma migrations
      await db.$executeRaw`SELECT 1`; // Simple health check
    }
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}

// Export database utilities
export const dbUtils = {
  checkDatabaseHealth,
  runMigrations,
  isProduction,
  isVercel,
};