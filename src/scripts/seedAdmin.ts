import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        role: 'ADMIN',
        plan: 'ENTERPRISE',
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        plan: true,
        emailVerified: true,
        createdAt: true,
      }
    });

    console.log('✅ Admin user created successfully:', admin);
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');
    console.log('💎 Plan: ENTERPRISE');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();