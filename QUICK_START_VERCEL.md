# Quick Start: Vercel Deployment

## 5-Minute Deployment Guide

### Prerequisites
- Vercel account (free)
- GitHub repository with your code
- PostgreSQL database (Vercel Postgres recommended)

### Step 1: Set Up Database
```bash
# Install Vercel CLI
npm install -g vercel

# Create PostgreSQL database
vercel postgres create

# Get connection string
vercel env ls
```

### Step 2: Configure Environment
Create `.env.vercel` file:
```env
DATABASE_URL=your-postgresql-connection-string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
JWT_SECRET=your-super-secret-jwt-key
```

### Step 3: Deploy
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 4: Set Environment Variables in Vercel
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add variables from `.env.vercel`
3. Select "Production" environment
4. Redeploy

### Step 5: Verify
```bash
# Check health
curl https://your-app.vercel.app/api/health
```

## Alternative: GitHub Integration

1. **Connect GitHub** to Vercel dashboard
2. **Import** your repository
3. **Configure** build settings:
   - Build Command: `npm run vercel:build`
   - Output Directory: `.next`
4. **Add environment variables**
5. **Deploy**

## Common Commands

```bash
# Local development
npm run dev

# Build for Vercel
npm run vercel:build

# Deploy to production
npm run vercel:deploy

# Database operations
npm run db:vercel:generate
npm run db:vercel:push
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, ensure all dependencies are installed |
| Database error | Verify DATABASE_URL, enable SSL |
| Environment variables | Ensure they're set in Vercel dashboard |
| Real-time features | Use polling endpoints instead of Socket.IO |

## Need Help?

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Status: [vercel.com/status](https://vercel.com/status)
- This Guide: `VERCEL_DEPLOYMENT.md`

---

**Done!** Your app is now deployed on Vercel. 🚀