# Production Deployment Guide

## Overview

This guide covers deploying the By God's Grace Management System to production with all security, performance, and monitoring features enabled.

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- Domain name (optional but recommended)
- CDN service (Cloudflare, Vercel, Netlify, etc.)

## 1. Environment Configuration

### 1.1 Create Production Environment File

Copy the template and configure your production environment:

```bash
cp env.production.template .env.production
```

### 1.2 Configure Environment Variables

Edit `.env.production` with your actual values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Application Configuration
VITE_APP_NAME="By God's Grace Management System"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Performance Configuration
VITE_CACHE_TTL=300000
VITE_MAX_CACHE_SIZE=1000
VITE_PAGINATION_DEFAULT_LIMIT=20
VITE_PAGINATION_MAX_LIMIT=100

# Security Configuration
VITE_RATE_LIMIT_LOGIN_ATTEMPTS=5
VITE_RATE_LIMIT_LOGIN_WINDOW=900000
VITE_RATE_LIMIT_API_CALLS=100
VITE_RATE_LIMIT_API_WINDOW=60000
VITE_SESSION_DURATION=28800000

# Monitoring Configuration
VITE_ERROR_LOGGING_ENABLED=true
VITE_ERROR_LOG_RETENTION_DAYS=30
VITE_PERFORMANCE_MONITORING=true
VITE_ANALYTICS_ENABLED=true

# CDN Configuration
VITE_CDN_URL=https://your-cdn-domain.com
VITE_ASSET_PREFIX=/assets

# Feature Flags
VITE_ENABLE_BACKUP_RESTORE=true
VITE_ENABLE_GOOGLE_SHEETS_INTEGRATION=true
VITE_ENABLE_THEME_CUSTOMIZATION=true
VITE_ENABLE_ADVANCED_ANALYTICS=true

# Development/Testing (should be false in production)
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEVELOPER_TOOLS=false
```

## 2. Database Setup

### 2.1 Run Database Migrations

```bash
# Apply all migrations including concurrency control
npx supabase db push
```

### 2.2 Verify Database Schema

Check that all tables have version columns for optimistic locking:

```sql
-- Verify version columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('retailers', 'orders', 'products', 'salespersons', 'profiles')
AND column_name = 'version';
```

### 2.3 Set Up Database Monitoring

Enable Supabase monitoring features:

1. Go to your Supabase dashboard
2. Navigate to Settings > Database
3. Enable:
   - Query performance insights
   - Error tracking
   - Connection pooling (if available)

## 3. Build and Deploy

### 3.1 Install Dependencies

```bash
npm ci --production
```

### 3.2 Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting for better caching
- Optimized assets
- Source maps disabled for security

### 3.3 Deploy to CDN/Static Host

#### Option A: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

#### Option B: Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Deploy: `netlify deploy --prod --dir=dist`

#### Option C: Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set publish directory: `dist`

#### Option D: Manual CDN Upload

1. Upload `dist/` contents to your CDN
2. Configure your CDN for:
   - Gzip compression
   - Cache headers
   - HTTPS redirects

## 4. Security Configuration

### 4.1 Content Security Policy

Add CSP headers to your hosting platform:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

### 4.2 Security Headers

Add these headers to your hosting platform:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 4.3 Rate Limiting

Configure rate limiting at your hosting platform or CDN:

- Login attempts: 5 per 15 minutes per IP
- API calls: 100 per minute per user
- General requests: 1000 per minute per IP

## 5. Monitoring Setup

### 5.1 Error Tracking

The application automatically logs errors to the database. Monitor them via:

```sql
-- View recent errors
SELECT * FROM error_logs 
WHERE level = 'error' 
ORDER BY timestamp DESC 
LIMIT 100;
```

### 5.2 Performance Monitoring

Performance metrics are stored in localStorage and can be viewed in browser dev tools:

```javascript
// View performance metrics
JSON.parse(localStorage.getItem('performance_metrics') || '[]')

// View user actions
JSON.parse(localStorage.getItem('user_actions') || '[]')
```

### 5.3 Third-party Monitoring (Optional)

Consider adding:

- **Sentry** for error tracking
- **Google Analytics** for user behavior
- **New Relic** for performance monitoring

## 6. Backup and Recovery

### 6.1 Database Backups

Supabase provides automatic backups, but you can also:

1. Use the built-in backup service in the admin panel
2. Set up automated backups via Supabase CLI
3. Export data manually via SQL

### 6.2 Application Backups

The application includes a backup/restore feature accessible to admin users.

## 7. Performance Optimization

### 7.1 CDN Configuration

Configure your CDN for:

- **Caching**: Cache static assets for 1 year
- **Compression**: Enable Gzip/Brotli compression
- **Minification**: Minify HTML, CSS, JS
- **Image optimization**: Compress and serve WebP images

### 7.2 Database Optimization

- Monitor slow queries in Supabase dashboard
- Add indexes for frequently queried columns
- Use connection pooling (handled by Supabase)

### 7.3 Application Optimization

The build process includes:
- Tree shaking to remove unused code
- Code splitting for better caching
- Asset optimization and compression

## 8. Testing Production

### 8.1 Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring enabled
- [ ] Backup system tested
- [ ] SSL certificate valid
- [ ] CDN configured

### 8.2 Post-deployment Tests

1. **Authentication**: Test login/logout flows
2. **Data Operations**: Test CRUD operations
3. **Performance**: Check page load times
4. **Security**: Test rate limiting and input validation
5. **Monitoring**: Verify error logging works
6. **Backup**: Test backup/restore functionality

## 9. Maintenance

### 9.1 Regular Tasks

- Monitor error logs weekly
- Review performance metrics monthly
- Update dependencies quarterly
- Test backup/restore monthly
- Review security settings quarterly

### 9.2 Scaling Considerations

- **Users**: System supports up to 100,000 users (Supabase Pro)
- **Data**: Monitor database size and optimize queries
- **Performance**: Use caching for frequently accessed data
- **Security**: Regular security audits and updates

## 10. Troubleshooting

### 10.1 Common Issues

**Build Fails**
- Check Node.js version (18+ required)
- Clear node_modules and reinstall
- Check for TypeScript errors

**Database Connection Issues**
- Verify Supabase URL and keys
- Check RLS policies
- Verify network connectivity

**Performance Issues**
- Check CDN configuration
- Monitor database query performance
- Review caching settings

**Security Issues**
- Verify CSP headers
- Check rate limiting configuration
- Review error logs for suspicious activity

### 10.2 Support

For issues:
1. Check error logs in database
2. Review browser console for client-side errors
3. Check Supabase dashboard for database issues
4. Review monitoring metrics for performance issues

## 11. Cost Optimization

### 11.1 Supabase Costs

- **Free Tier**: Up to 50,000 monthly active users
- **Pro Tier**: $25/month for up to 100,000 users
- **Enterprise**: Custom pricing for larger scale

### 11.2 CDN Costs

- **Cloudflare**: Free tier available
- **Vercel**: Free tier for personal projects
- **Netlify**: Free tier available

### 11.3 Monitoring Costs

- Built-in monitoring: Free
- Third-party services: Varies by provider

## 12. Security Best Practices

1. **Regular Updates**: Keep dependencies updated
2. **Access Control**: Use role-based access control
3. **Data Encryption**: All data encrypted in transit and at rest
4. **Audit Logging**: Monitor all user actions
5. **Backup Security**: Secure backup storage
6. **Incident Response**: Have a plan for security incidents

---

This deployment guide ensures your application is production-ready with enterprise-grade security, performance, and monitoring features. 