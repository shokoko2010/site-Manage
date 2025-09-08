import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        plan: 'ENTERPRISE',
        emailVerified: true,
      }
    });

    // Create default regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        username: 'user',
        password: userPassword,
        name: 'Regular User',
        role: 'USER',
        plan: 'FREE',
        emailVerified: true,
      }
    });

    // Create default tags
    const defaultTags = [
      { name: 'Technology', slug: 'technology' },
      { name: 'Business', slug: 'business' },
      { name: 'Marketing', slug: 'marketing' },
      { name: 'SEO', slug: 'seo' },
      { name: 'Content Marketing', slug: 'content-marketing' },
      { name: 'Social Media', slug: 'social-media' },
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Design', slug: 'design' },
    ];

    for (const tag of defaultTags) {
      await prisma.tag.upsert({
        where: { name: tag.name },
        update: {},
        create: tag
      });
    }

    // Create default categories
    const defaultCategories = [
      { name: 'Blog Posts', slug: 'blog-posts' },
      { name: 'Articles', slug: 'articles' },
      { name: 'Tutorials', slug: 'tutorials' },
      { name: 'News', slug: 'news' },
      { name: 'Reviews', slug: 'reviews' },
      { name: 'Case Studies', slug: 'case-studies' },
      { name: 'Guides', slug: 'guides' },
      { name: 'Opinions', slug: 'opinions' },
    ];

    for (const category of defaultCategories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }

    console.log('✅ Database setup completed successfully!');
    console.log('👤 Default admin user: admin@example.com / admin123');
    console.log('👤 Default regular user: user@example.com / user123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();