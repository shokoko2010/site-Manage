# Backend Setup Guide

This guide will help you set up the backend infrastructure for the Zex-Content application with a proper database and API endpoints.

## 🏗️ Architecture Overview

The backend consists of:
- **Database**: PostgreSQL with Prisma ORM
- **API Server**: Express.js with TypeScript
- **Authentication**: JWT-based authentication
- **Security**: Rate limiting, CORS, helmet, validation
- **Analytics**: Comprehensive tracking and reporting
- **Backup**: Automated database backup system

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🚀 Setup Instructions

### 1. Database Setup

#### Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Create Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE zex_content_db;
CREATE USER zex_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zex_content_db TO zex_user;
\q
```

### 2. Environment Configuration

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Update `.env` with your database credentials:

```env
# Database
DATABASE_URL="postgresql://zex_user:your_secure_password@localhost:5432/zex_content_db?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12

# Backup Configuration
BACKUP_DIR="./backups"
BACKUP_RETENTION_DAYS=30
INCLUDE_ANALYTICS=true
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or create a migration (recommended for production)
npm run db:migrate
```

### 5. Setup Initial Data

```bash
# Create default users, tags, and categories
npm run db:setup
```

### 6. Start the Backend Server

```bash
# Development mode with auto-restart
npm run server

# Production mode
npm run server:prod
```

The server will start on `http://localhost:3001`

## 🔧 Available Scripts

### Database Operations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:setup` - Setup initial database data

### Backup Operations
- `npm run backup:create` - Create database backup
- `npm run backup:list` - List available backups
- `npm run backup:restore <backup-name>` - Restore from backup

### Server Operations
- `npm run server` - Start development server
- `npm run server:prod` - Start production server

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/password` - Change password
- `PUT /api/users/:id/role` - Update user role (admin)
- `PUT /api/users/:id/plan` - Update user plan (admin)
- `DELETE /api/users/:id` - Delete user (super admin)

### WordPress Sites
- `GET /api/sites` - Get user's sites
- `GET /api/sites/:id` - Get specific site
- `POST /api/sites` - Create new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site
- `POST /api/sites/:id/sync` - Sync site with WordPress
- `GET /api/sites/:id/analytics` - Get site analytics

### Content Management
- `GET /api/content` - Get user's content (with filtering)
- `GET /api/content/:id` - Get specific content
- `POST /api/content` - Create new content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content
- `POST /api/content/:id/publish` - Publish content
- `GET /api/content/:id/analytics` - Get content analytics

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/user` - Get user analytics over time
- `GET /api/analytics/sites/:siteId` - Get site analytics
- `GET /api/analytics/content/:contentId` - Get content analytics
- `POST /api/analytics/report` - Generate analytics report

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### User Roles and Permissions

- **SUPER_ADMIN**: Full system access
- **ADMIN**: User management and all content features
- **USER**: Limited by subscription plan

### Subscription Plans

| Plan | Features |
|------|----------|
| FREE | View dashboard, view own content |
| BASIC | + Create content, edit own content |
| PREMIUM | + Delete content, view analytics |
| ENTERPRISE | + Manage users, view all content |

## 🛡️ Security Features

- **JWT Authentication**: Stateless authentication with refresh tokens
- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS**: Configured for specific frontend domains
- **Helmet**: Security headers for Express.js
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: bcrypt with configurable rounds
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 📈 Analytics and Monitoring

### User Analytics
- Content creation and publishing metrics
- Site connection statistics
- View and comment tracking

### Content Analytics
- Performance tracking per content item
- Engagement metrics
- Historical data analysis

### Site Analytics
- WordPress site performance
- Content sync statistics
- Multi-site comparison

## 💾 Backup Strategy

### Automated Backups
- Daily compressed backups
- Configurable retention period (default: 30 days)
- PostgreSQL native format for reliability

### Manual Operations
```bash
# Create backup
npm run backup:create

# List backups
npm run backup:list

# Restore backup
npm run backup:restore backup-name.sql.gz
```

### Backup Location
Backups are stored in the `./backups` directory by default. This can be configured via the `BACKUP_DIR` environment variable.

## 🔧 Development

### Database Schema Management
```bash
# View database schema
npm run db:studio

# Create migration after schema changes
npx prisma migrate dev --name migration-name

# Reset database (dev only)
npx prisma migrate reset
```

### Testing API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🚀 Production Deployment

### Environment Variables
Set these environment variables in production:

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-production-secret-key"
FRONTEND_URL="https://yourdomain.com"
```

### Process Management
Use PM2 or similar process manager:

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/server.js --name zex-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Database Optimization
- Configure PostgreSQL for production
- Set up connection pooling
- Enable query caching
- Configure proper indexes

### Security Best Practices
- Use HTTPS in production
- Set up proper CORS policies
- Implement request logging
- Monitor for suspicious activity
- Regular security updates

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U zex_user -d zex_content_db
```

#### Migration Issues
```bash
# Reset database (dev only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

## 📚 API Documentation

For detailed API documentation, visit `/api/docs` when the server is running (if swagger is configured) or use the provided endpoint examples above.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Update database schema if needed
4. Create and run migrations
5. Test your changes
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.