import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'dist')));

// Basic health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'HEALTHY'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'UNHEALTHY'
    });
  }
});

// Basic auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, name } = req.body;
    
    console.log('Registration attempt:', { email, username, name });
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        role: 'USER',
        plan: 'FREE',
        emailVerified: false,
        isActive: true,
      }
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'Authorization token is required'
      });
    }
    
    // For simplicity, we'll just return a new token
    // In a real application, you would validate the refresh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Invalid or expired refresh token'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // In a real application, you might want to blacklist the token
      // For now, we just acknowledge the logout request
      console.log('Logout request received');
    }
    
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

// Get user profile (auth/me endpoint)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authorization token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        plan: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid user',
        message: 'User not found or inactive'
      });
    }
    
    res.json({
      user
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Get user profile
app.get('/api/users/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authorization token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        plan: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid user',
        message: 'User not found or inactive'
      });
    }
    
    res.json({
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Get sites
app.get('/api/sites', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authorization token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const sites = await prisma.wordPressSite.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      sites
    });
  } catch (error) {
    console.error('Sites error:', error);
    res.status(500).json({
      error: 'Sites fetch failed',
      message: 'An error occurred while fetching sites'
    });
  }
});

// Create site
app.post('/api/sites', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authorization token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const { url, name, username, appPassword, isVirtual } = req.body;
    
    const site = await prisma.wordPressSite.create({
      data: {
        url,
        name: name || url,
        username,
        appPassword,
        isVirtual: isVirtual || false,
        userId: decoded.userId,
        isActive: true,
        lastSyncedAt: new Date()
      }
    });
    
    res.status(201).json({
      message: 'Site created successfully',
      site
    });
  } catch (error) {
    console.error('Site creation error:', error);
    res.status(500).json({
      error: 'Site creation failed',
      message: 'An error occurred while creating site'
    });
  }
});

// Get content
app.get('/api/content', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authorization token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const content = await prisma.generatedContent.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      content
    });
  } catch (error) {
    console.error('Content error:', error);
    res.status(500).json({
      error: 'Content fetch failed',
      message: 'An error occurred while fetching content'
    });
  }
});

// Create content
app.post('/api/content', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authorization token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const { title, body, type, metaDescription, language, featuredImage } = req.body;
    
    const content = await prisma.generatedContent.create({
      data: {
        title,
        body,
        type: type || 'ARTICLE',
        metaDescription,
        language: language || 'ENGLISH',
        featuredImage,
        userId: decoded.userId,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(201).json({
      message: 'Content created successfully',
      content
    });
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({
      error: 'Content creation failed',
      message: 'An error occurred while creating content'
    });
  }
});

// Serve index.html for all non-API routes (SPA routing)
app.get(/^\/(?!api|health).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌍 Frontend: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;