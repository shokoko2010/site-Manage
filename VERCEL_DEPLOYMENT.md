# Vercel Deployment Guide

This guide will help you deploy the Site Management application to Vercel.

## Overview

The application has been prepared for Vercel deployment with the following modifications:

### Key Changes Made:
1. **Serverless Architecture**: Removed custom HTTP server dependency
2. **Database Support**: Added PostgreSQL support for production
3. **Real-time Features**: Implemented polling-based alternatives to Socket.IO
4. **Environment Configuration**: Added Vercel-specific environment setup
5. **Build Optimization**: Updated build scripts for Vercel compatibility

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **PostgreSQL Database**: Set up a PostgreSQL database (recommended options below)
4. **Domain Name**: (Optional) Custom domain for your application

## Database Setup

### Recommended PostgreSQL Providers:

#### 1. Vercel Postgres (Easiest)
```bash
# Install Vercel CLI
npm install -g vercel

# Create PostgreSQL database
vercel postgres create

# Get connection string
vercel env ls
```

#### 2. Supabase (Free Tier Available)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get database connection string from Settings → Database

#### 3. PlanetScale (MySQL Compatible)
1. Create account at [planetscale.com](https://planetscale.com)
2. Create new database
3. Get connection string

#### 4. Railway (Easy Setup)
1. Create account at [railway.app](https://railway.app)
2. Create PostgreSQL service
3. Get connection string

## Environment Variables

### Required Variables:

```env
# Application Settings
NODE_ENV=production
VERCEL=1
NEXT_TELEMETRY_DISABLED=1

# Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Application URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Optional Variables:

```env
# AI Services
GOOGLE_AI_API_KEY=your-google-ai-api-key
OPENAI_API_KEY=your-openai-api-key

# File Storage
AWS_S3_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Email Service
EMAIL_FROM=noreply@your-app.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# Analytics
GOOGLE_ANALYTICS_ID=your-google-analytics-id
```

## Deployment Steps

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy to Vercel**:
```bash
# Link to your project
vercel

# Deploy to production
vercel --prod
```

4. **Set Environment Variables**:
```bash
# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

### Method 2: GitHub Integration

1. **Connect GitHub to Vercel**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required environment variables
   - Make sure to select "Production" environment

3. **Deploy**:
   - Vercel will automatically deploy on every push to main branch
   - Or trigger manual deployment from dashboard

### Method 3: Vercel Dashboard

1. **Create New Project**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Upload project files or connect Git repository

2. **Configure Build Settings**:
   - Build Command: `npm run vercel:build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**:
   - Go to Settings → Environment Variables
   - Add all required variables

## Database Migration

### For Vercel Deployment:

1. **Generate Prisma Client**:
```bash
npm run db:vercel:generate
```

2. **Push Schema to Database**:
```bash
npm run db:vercel:push
```

### Alternative: Use Vercel Build Command

The `vercel:build` script automatically handles database setup:

```bash
npm run vercel:build
```

## Post-Deployment Steps

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health
```

### 2. Test Database Connection
- Access your application
- Try to register/login
- Check if data is being saved correctly

### 3. Configure Domain (Optional)
- Go to Vercel dashboard
- Navigate to your project
- Go to Settings → Domains
- Add your custom domain

### 4. Set Up Monitoring (Optional)
- Enable Vercel Analytics
- Set up error monitoring (Sentry, etc.)
- Configure logging

## Troubleshooting

### Common Issues:

#### 1. Database Connection Errors
**Problem**: `Database connection failed`
**Solution**:
- Verify DATABASE_URL is correct
- Ensure SSL is enabled (`sslmode=require`)
- Check database firewall settings

#### 2. Build Failures
**Problem**: Build process fails
**Solution**:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript configuration

#### 3. Environment Variables Not Loading
**Problem**: App can't access environment variables
**Solution**:
- Ensure variables are set in Vercel dashboard
- Restart deployment after adding variables
- Check variable names for typos

#### 4. Real-time Features Not Working
**Problem**: Socket.IO or real-time updates not working
**Solution**:
- This is expected in Vercel serverless environment
- Use polling-based alternatives implemented in `/api/notifications/poll`

#### 5. File Upload Issues
**Problem**: File uploads not working
**Solution**:
- Configure AWS S3 or other cloud storage
- Update environment variables for file storage
- Ensure proper CORS configuration

### Debug Commands:

```bash
# Check build locally
npm run vercel:build

# Test with Vercel dev
npm run vercel:dev

# Check environment variables
vercel env ls

# View deployment logs
vercel logs your-app.vercel.app
```

## Performance Optimization

### 1. Enable Caching
```javascript
// In your API routes, add caching headers
export async function GET() {
  return new Response(JSON.stringify({ data }), {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  });
}
```

### 2. Optimize Images
- Use Next.js Image component
- Enable Vercel Image Optimization
- Configure proper image formats

### 3. Database Optimization
- Add proper indexes to your database
- Use connection pooling
- Implement query caching

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data to repository
- Use Vercel's environment variable management
- Rotate secrets regularly

### 2. Database Security
- Use SSL connections
- Implement proper user permissions
- Regular backups

### 3. Application Security
- Enable CORS protection
- Implement rate limiting
- Use HTTPS everywhere

## Scaling

### 1. Vertical Scaling
- Upgrade Vercel plan for more resources
- Increase database instance size

### 2. Horizontal Scaling
- Vercel automatically scales serverless functions
- Use load balancers for database
- Implement caching strategies

## Backup and Recovery

### 1. Database Backups
- Enable automated backups in your PostgreSQL provider
- Regular manual backups before major changes
- Test backup restoration process

### 2. Application Backups
- Keep your GitHub repository up to date
- Use Vercel's deployment history
- Export configuration regularly

## Support

If you encounter issues during deployment:

1. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **Vercel Status**: [vercel.com/status](https://vercel.com/status)
3. **Community Support**: [vercel.com/community](https://vercel.com/community)
4. **GitHub Issues**: Create an issue in the project repository

## Next Steps

After successful deployment:

1. **Monitor Performance**: Use Vercel Analytics
2. **Set Up Alerts**: Configure error monitoring
3. **Optimize**: Based on usage patterns
4. **Scale**: Upgrade resources as needed

---

**Note**: This application uses serverless architecture, which means some features like persistent WebSocket connections (Socket.IO) are not available. Real-time features have been replaced with polling-based alternatives for Vercel compatibility.