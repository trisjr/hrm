# Deployment Guide - HRM System

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm build`)
- [ ] Linter warnings reviewed
- [ ] Code reviewed and approved
- [ ] Changelog updated

### Security

- [ ] Security audit completed
- [ ] Dependencies updated (no critical vulnerabilities)
- [ ] Secrets rotated if needed
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Performance

- [ ] Database indexes verified
- [ ] Query performance tested with production-like data
- [ ] Bundle size optimized
- [ ] Assets optimized (images, fonts)

### Data

- [ ] Database backup created
- [ ] Migration scripts tested on staging
- [ ] Seed data ready (for new deployments)
- [ ] Data migration plan documented (if needed)

---

## Environment Setup

### Required Services

1. **PostgreSQL Database** (v15+)
   - Options: Neon, Supabase, Railway, AWS RDS
   - Recommended: Neon (serverless, cost-effective)

2. **Hosting Platform**
   - Options: Vercel, Cloudflare Pages
   - Recommended: Vercel (best TanStack Start support)

3. **Email Service** (Optional but recommended)
   - Options: SendGrid, Resend, AWS SES
   - For: Welcome emails, notifications

### Environment Variables

Create `.env.production` with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
JWT_SECRET="your-secure-random-string-min-32-chars"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="production"
PUBLIC_URL="https://your-domain.com"

# Email (Optional)
EMAIL_FROM="noreply@your-domain.com"
EMAIL_SMTP_HOST="smtp.your-provider.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="your-smtp-username"
EMAIL_SMTP_PASSWORD="your-smtp-password"

# Feature Flags (Optional)
ENABLE_EMAIL_NOTIFICATIONS="true"
```

### Generating Secrets

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

---

## Database Setup

### 1. Create Database

#### Option A: Neon (Recommended)

```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Create project
neonctl projects create --name hrm-production

# Get connection string
neonctl connection-string --project-id <your-project-id>
```

#### Option B: Supabase

```bash
# Create project at https://supabase.com
# Navigate to Settings > Database
# Copy connection string (use Transaction mode for Drizzle)
```

### 2. Configure Database Connection

```bash
# Update .env.production
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### 3. Run Migrations

```bash
# Generate migration files (if schema changed)
pnpm db:generate

# Push schema to production database
pnpm db:push

# OR apply migrations (if using migration files)
pnpm db:migrate
```

### 4. Seed Initial Data

```bash
# Seed required data (roles, admin user, email templates)
pnpm db:seed
```

**Important**: Review `src/db/seed.ts` to ensure production-appropriate data.

---

## Deployment Process

### Vercel Deployment

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Configure Project

```bash
# Login to Vercel
vercel login

# Link project (first time)
vercel link

# Set environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
# ... repeat for all environment variables
```

#### 3. Deploy

```bash
# Deploy to production
vercel --prod

# Or configure for automatic deployment
# Push to main branch triggers deployment
```

### Cloudflare Pages Deployment

#### 1. Create Project

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Create project
wrangler pages project create hrm-production
```

#### 2. Configure Build Settings

```toml
# wrangler.toml
name = "hrm-production"
compatibility_date = "2024-01-01"

[build]
command = "pnpm build"
cwd = "."

[env.production]
vars = { NODE_ENV = "production" }
```

#### 3. Deploy

```bash
# Deploy to production
wrangler pages deploy dist/

# Or connect to Git repository for automatic deployments
```

---

## Post-Deployment Verification

### 1. Smoke Tests

```bash
# Test critical endpoints
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techhouse.com","password":"123456"}'
```

### 2. Manual UI Testing

- [ ] Login with admin account
- [ ] Navigate to each main section
- [ ] Create a test user
- [ ] Create a test team
- [ ] Trigger an email notification (if enabled)
- [ ] Access a mobile device and verify responsive design

### 3. Performance Check

```bash
# Use Lighthouse or similar tools
npx lighthouse https://your-domain.com --view

# Expected scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### 4. Database Verification

```bash
# Connect to production database
psql $DATABASE_URL

# Verify table creation
\dt

# Check seed data
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM users WHERE role_name = 'ADMIN';
SELECT COUNT(*) FROM email_templates;

\q
```

---

## Rollback Procedure

### If Deployment Fails

#### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

#### Cloudflare Pages

```bash
# View deployments
wrangler pages deployment list

# Promote previous deployment
wrangler pages deployment promote <deployment-id>
```

### If Database Migration Fails

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup_file.dump

# OR manually revert migration
# Review and run SQL DOWN migration scripts
```

### Emergency Rollback Checklist

- [ ] Revert to previous deployment
- [ ] Restore database backup if schema changed
- [ ] Notify users of temporary downtime
- [ ] Review logs to identify root cause
- [ ] Fix issues locally before re-deploying

---

## Monitoring & Maintenance

### 1. Setup Monitoring

#### Application Monitoring (Recommended: Sentry)

```bash
npm install @sentry/node

# In app/server/index.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
})
```

#### Database Monitoring

- **Neon**: Built-in dashboard
- **Supabase**: Built-in metrics
- **Self-hosted**: Use pg_stat_statements

### 2. Setup Alerts

Create alerts for:

- High error rate (> 1% of requests)
- Slow queries (> 1 second)
- Database connection pool exhaustion
- Disk space usage (> 80%)

### 3. Regular Maintenance Tasks

#### Weekly

- [ ] Review error logs
- [ ] Check database query performance
- [ ] Monitor disk usage

#### Monthly

- [ ] Update dependencies (`pnpm update`)
- [ ] Review security advisories
- [ ] Backup database
- [ ] Clean up old logs

#### Quarterly

- [ ] Full security audit
- [ ] Performance optimization review
- [ ] User feedback review
- [ ] Feature usage analytics

### 4. Backup Strategy

#### Automated Daily Backups

**Neon** (automatic, 7-day retention)
**Supabase** (automatic, 7-day retention in paid plans)

**Custom Backup Script**:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.dump"

pg_dump $DATABASE_URL -Fc > $BACKUP_FILE

# Upload to S3 or similar
aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

# Keep only last 30 days
find . -name "backup_*.dump" -mtime +30 -delete
```

#### Backup Verification

```bash
# Monthly: Restore backup to staging and verify
pg_restore -d $STAGING_DATABASE_URL backup_file.dump
```

---

## Scaling Considerations

### When to Scale

Monitor these metrics:

- **CPU**: consistently > 70%
- **Memory**: consistently > 80%
- **Database Connections**: approaching pool limit
- **Response Time**: p95 > 500ms

### Horizontal Scaling (More Instances)

**Vercel**: Automatic with Pro plan
**Cloudflare**: Automatic with Workers

### Vertical Scaling (Bigger Database)

**Neon**: Upgrade compute units
**Supabase**: Upgrade tier

### Database Optimization

```sql
-- Add indexes for slow queries
CREATE INDEX CONCURRENTLY idx_user_assessments_user_cycle
ON user_assessments(user_id, cycle_id);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM user_assessments WHERE ...;

-- Vacuum and analyze tables
VACUUM ANALYZE;
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check connection string format
echo $DATABASE_URL

# Test direct connection
psql $DATABASE_URL -c "SELECT version();"

# Verify SSL mode
# Should have: ?sslmode=require
```

#### 2. Build Failures

```bash
# Clear cache and rebuild
rm -rf .cache dist
pnpm install
pnpm build
```

#### 3. Email Not Sending

```bash
# Verify SMTP credentials
# Test with simple script
node -e "require('./test-email.js')"

# Check email logs
# Review server function logs for email sending errors
```

#### 4. Slow Performance

```bash
# Check database query performance
# Enable pg_stat_statements in PostgreSQL

# Analyze bundle size
pnpm build
npx vite-bundle-visualizer

# Use production build locally to test
NODE_ENV=production pnpm preview
```

---

## Support & Resources

### Documentation

- [TanStack Start Docs](https://tanstack.com/start)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Vercel Deployment](https://vercel.com/docs)
- [Neon Database](https://neon.tech/docs)

### Internal Resources

- [System Overview](./SYSTEM_OVERVIEW.md)
- [User Guides](./user_guides/)
- [API Documentation](./API_ENDPOINTS.md)

### Emergency Contacts

- **Technical Lead**: [Contact Info]
- **DevOps**: [Contact Info]
- **Database Admin**: [Contact Info]

---

**Last Updated**: January 16, 2026
**Version**: 1.0
