import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validateRegister, validateLogin, handleValidation } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', validateRegister, handleValidation, async (req, res) => {
  try {
    const { email, username, password, name } = req.body;

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
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        plan: true,
        avatar: true,
        bio: true,
        createdAt: true,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', validateLogin, handleValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create or update session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Invalidate old sessions
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      plan: user.plan,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    // Log activity
    if (req.user) {
      await prisma.activity.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        }
      });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        plan: true,
        avatar: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = jwt.sign(
      { userId: req.user!.id, email: req.user!.email, role: req.user!.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.updateMany({
      where: { userId: req.user!.id },
      data: {
        token: newToken,
        expiresAt,
      }
    });

    res.json({
      token: newToken,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;