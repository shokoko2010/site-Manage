import { PrismaClient } from '@prisma/client';
import { execSync, exec } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

class PostgreSQLSetup {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');

    // Check if PostgreSQL is installed
    try {
      execSync('psql --version', { stdio: 'pipe' });
      console.log('✅ PostgreSQL is installed');
    } catch (error) {
      console.error('❌ PostgreSQL is not installed or not in PATH');
      console.log('Please install PostgreSQL and ensure it\'s in your PATH');
      process.exit(1);
    }

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set in environment variables');
      console.log('Please set DATABASE_URL in your .env file');
      process.exit(1);
    }

    console.log('✅ DATABASE_URL is configured');
  }

  async createDatabaseIfNotExists(): Promise<void> {
    console.log('🗄️  Checking database existence...');
    
    try {
      // Try to connect to the database
      await this.prisma.$connect();
      console.log('✅ Database exists and is accessible');
    } catch (error) {
      console.log('📝 Database does not exist, creating it...');
      
      // Extract database name from DATABASE_URL
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = url.pathname.slice(1); // Remove leading slash
      
      // Remove database name from URL to connect to default database
      url.pathname = '/postgres';
      const defaultDbUrl = url.toString();
      
      try {
        // Create database using default connection
        const createDbCommand = `createdb "${dbName}"`;
        
        execSync(createDbCommand, { 
          env: { ...process.env, PGDATABASE: 'postgres' },
          stdio: 'inherit'
        });
        
        console.log(`✅ Database '${dbName}' created successfully`);
      } catch (error) {
        console.error('❌ Failed to create database:', error);
        console.log('Please ensure you have proper PostgreSQL permissions');
        process.exit(1);
      }
    }
  }

  async runPrismaMigrations(): Promise<void> {
    console.log('🔄 Running Prisma migrations...');
    
    try {
      // Generate Prisma client
      console.log('🔧 Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      // Run migrations
      console.log('📊 Running database migrations...');
      execSync('npx prisma migrate dev', { stdio: 'inherit' });
      
      console.log('✅ Prisma migrations completed');
    } catch (error) {
      console.error('❌ Failed to run Prisma migrations:', error);
      throw error;
    }
  }

  async createSeedData(): Promise<void> {
    console.log('🌱 Creating seed data...');
    
    try {
      // Check if admin user already exists
      const adminExists = await this.prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      });

      if (!adminExists) {
        console.log('👤 Creating super admin user...');
        
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        await this.prisma.user.create({
          data: {
            email: 'admin@example.com',
            username: 'admin',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            plan: 'ENTERPRISE',
            emailVerified: true,
            isActive: true,
          },
        });
        
        console.log('✅ Super admin user created');
        console.log('   Email: admin@example.com');
        console.log('   Password: admin123');
        console.log('   ⚠️  Please change this password immediately!');
      } else {
        console.log('ℹ️  Admin user already exists');
      }

      // Create default tags
      const defaultTags = [
        { name: 'Technology', slug: 'technology', color: '#3B82F6' },
        { name: 'Business', slug: 'business', color: '#10B981' },
        { name: 'Marketing', slug: 'marketing', color: '#F59E0B' },
        { name: 'Design', slug: 'design', color: '#8B5CF6' },
        { name: 'Development', slug: 'development', color: '#EF4444' },
      ];

      for (const tag of defaultTags) {
        await this.prisma.tag.upsert({
          where: { slug: tag.slug },
          update: tag,
          create: tag,
        });
      }

      console.log('✅ Default tags created');

      // Create default categories
      const defaultCategories = [
        { name: 'Articles', slug: 'articles', color: '#3B82F6' },
        { name: 'Tutorials', slug: 'tutorials', color: '#10B981' },
        { name: 'News', slug: 'news', color: '#F59E0B' },
        { name: 'Reviews', slug: 'reviews', color: '#8B5CF6' },
        { name: 'Guides', slug: 'guides', color: '#EF4444' },
      ];

      for (const category of defaultCategories) {
        await this.prisma.category.upsert({
          where: { slug: category.slug },
          update: category,
          create: category,
        });
      }

      console.log('✅ Default categories created');
      
    } catch (error) {
      console.error('❌ Failed to create seed data:', error);
      throw error;
    }
  }

  async verifySetup(): Promise<void> {
    console.log('🔍 Verifying setup...');
    
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');

      // Count records
      const userCount = await this.prisma.user.count();
      const tagCount = await this.prisma.tag.count();
      const categoryCount = await this.prisma.category.count();

      console.log('📊 Setup verification:');
      console.log(`  👥 Users: ${userCount}`);
      console.log(`  🏷️  Tags: ${tagCount}`);
      console.log(`  📁 Categories: ${categoryCount}`);

      if (userCount > 0 && tagCount > 0 && categoryCount > 0) {
        console.log('✅ Setup verification successful');
      } else {
        console.log('⚠️  Some seed data may be missing');
      }
    } catch (error) {
      console.error('❌ Setup verification failed:', error);
      throw error;
    }
  }

  async generateEnvFile(): Promise<void> {
    console.log('📝 Generating .env file...');
    
    const envExamplePath = join(process.cwd(), '.env.example');
    const envPath = join(process.cwd(), '.env');
    
    if (!existsSync(envPath) && existsSync(envExamplePath)) {
      const envExample = readFileSync(envExamplePath, 'utf8');
      
      // Replace placeholder values with secure defaults
      let envContent = envExample
        .replace(/your-super-secret-jwt-key-here-change-this-in-production/g, this.generateSecureKey(64))
        .replace(/your-session-secret-here/g, this.generateSecureKey(32))
        .replace(/username:password@localhost:5432\/database_name/g, 'postgres:postgres@localhost:5432/zex_content')
        .replace(/your-gemini-api-key-here/g, '')
        .replace(/your-openai-api-key-here/g, '');

      writeFileSync(envPath, envContent);
      console.log('✅ .env file generated from .env.example');
      console.log('⚠️  Please update the .env file with your actual configuration');
    } else if (existsSync(envPath)) {
      console.log('ℹ️  .env file already exists');
    } else {
      console.error('❌ .env.example file not found');
    }
  }

  private generateSecureKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 Starting PostgreSQL setup...');
      
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Generate .env file if needed
      await this.generateEnvFile();
      
      // Create database if it doesn't exist
      await this.createDatabaseIfNotExists();
      
      // Run Prisma migrations
      await this.runPrismaMigrations();
      
      // Create seed data
      await this.createSeedData();
      
      // Verify setup
      await this.verifySetup();
      
      console.log('🎉 PostgreSQL setup completed successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('  1. Review and update your .env file with proper configuration');
      console.log('  2. Start your application with: npm run server');
      console.log('  3. Access the application at: http://localhost:3001');
      console.log('  4. Login with admin credentials and change the password');
      
    } catch (error) {
      console.error('❌ PostgreSQL setup failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new PostgreSQLSetup();
  setup.run().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export default PostgreSQLSetup;