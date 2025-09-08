# Application Setup Guide

This guide will help you set up the enhanced Zex Content application with all the robustness improvements.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```bash
# Required: Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/zex_content"

# Required: Security
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"
SESSION_SECRET="your-session-secret-here"

# Required: External APIs
GEMINI_API_KEY="your-gemini-api-key-here"

# Optional: Redis (for caching)
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup

#### Option A: Automatic Setup (Recommended)

```bash
# Run the PostgreSQL setup script
npm run setup:postgres
```

#### Option B: Manual Setup

1. **Create PostgreSQL Database:**
```bash
createdb zex_content
```

2. **Run Migrations:**
```bash
npm run db:migrate
```

3. **Generate Prisma Client:**
```bash
npm run db:generate
```

4. **Create Seed Data:**
```bash
npm run db:setup
```

### 4. Start the Application

```bash
# Start the backend server
npm run server

# Start the frontend (in another terminal)
npm run dev
```

## Detailed Setup Instructions

### Database Configuration

#### PostgreSQL Setup

1. **Install PostgreSQL:**
   - Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
   - macOS: `brew install postgresql`
   - Windows: Download from [PostgreSQL.org](https://www.postgresql.org/download/)

2. **Create Database and User:**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE zex_content;

-- Create user (optional)
CREATE USER zex_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zex_content TO zex_user;

-- Exit PostgreSQL
\q
```

3. **Update Environment Variables:**
```env
DATABASE_URL="postgresql://zex_user:your_password@localhost:5432/zex_content"
```

#### Migration from SQLite (if applicable)

If you're migrating from the existing SQLite database:

```bash
# Run the migration script
npm run migrate:postgres
```

This will:
1. Backup your SQLite data
2. Set up PostgreSQL
3. Migrate all data
4. Verify the migration

### Security Configuration

#### Generate Secure Keys

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Environment Variables

```env
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Database Configuration
DATABASE_URL="postgresql://user:pass@localhost:5432/zex_content"

# Security Configuration
JWT_SECRET="your-64-character-random-string"
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
SESSION_SECRET="your-32-character-random-string"
SESSION_SECURE_COOKIE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# External APIs
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
REDIS_TTL=300

# Security Headers
HELMET_CSP_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
```

### Production Setup

#### 1. Environment Setup

```bash
# Set production environment
export NODE_ENV=production

# Install production dependencies
npm ci --only=production
```

#### 2. Database Setup

```bash
# Run production migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

#### 3. Process Management

Using PM2 (recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'zex-content-server',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Development Setup

#### 1. Development Environment

```bash
# Install all dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development database
# (Make sure PostgreSQL is running)

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Start development servers
npm run server  # Backend
npm run dev     # Frontend
```

#### 2. Development Scripts

```bash
# Database operations
npm run db:studio          # Open Prisma Studio
npm run db:push            # Push schema changes
npm run db:reset           # Reset database

# Development tools
npm run lint              # Run ESLint
npm run build             # Build for production
npm run preview           # Preview production build

# Backup and restore
npm run backup:create     # Create backup
npm run backup:list       # List backups
npm run backup:restore    # Restore backup
```

### Testing the Setup

#### 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "database": "HEALTHY",
    "redis": "NOT_CONFIGURED",
    "external_apis": "CONFIGURED"
  },
  "metrics": {
    "memory": {...},
    "cpu": {...}
  }
}
```

#### 2. Environment Validation

```bash
curl http://localhost:3001/env-check
```

#### 3. API Endpoints

```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"TestPassword123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'
```

### Troubleshooting

#### Common Issues

1. **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
psql -U postgres -c "\l"

# Test connection
psql -U postgres -d zex_content -c "SELECT 1;"
```

2. **Port Already in Use**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

3. **Environment Variables Not Loading**
```bash
# Check if .env file exists
ls -la .env

# Test environment variables
node -e "console.log(process.env.DATABASE_URL)"
```

4. **Migration Issues**
```bash
# Reset database
npm run db:reset

# Check migration status
npx prisma migrate status

# Force reset
npx prisma migrate reset --force
```

#### Log Files

```bash
# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log

# PM2 logs (if using PM2)
pm2 logs zex-content-server
```

### Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use different values for development and production
   - Rotate secrets periodically

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

3. **Application Security**
   - Keep dependencies updated
   - Monitor logs for suspicious activity
   - Use HTTPS in production

4. **Server Security**
   - Configure firewall rules
   - Use reverse proxy
   - Enable SSL/TLS

### Performance Optimization

1. **Database Optimization**
   - Add indexes to frequently queried columns
   - Use connection pooling
   - Monitor query performance

2. **Application Optimization**
   - Enable caching (Redis)
   - Use compression
   - Optimize asset delivery

3. **Server Optimization**
   - Use cluster mode
   - Monitor resource usage
   - Scale horizontally

## Support

If you encounter any issues during setup:

1. Check the logs in the `logs/` directory
2. Review the troubleshooting section
3. Check the GitHub issues for similar problems
4. Create a new issue with detailed information

## Next Steps

After successful setup:

1. **Configure External Services**
   - Set up Gemini API key
   - Configure email service
   - Set up monitoring

2. **Customize Application**
   - Modify branding and styling
   - Configure user roles and permissions
   - Set up custom domains

3. **Deploy to Production**
   - Set up production database
   - Configure reverse proxy
   - Set up SSL certificates
   - Deploy application

Happy coding! 🚀