# Deployment Guide: GitHub + Netlify

This guide will walk you through deploying your Retailer Management System to GitHub and Netlify.

## 🚀 Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)

1. **Install GitHub CLI** (if not already installed):
   ```bash
   # Windows (using winget)
   winget install GitHub.cli
   
   # Or download from: https://cli.github.com/
   ```

2. **Login to GitHub**:
   ```bash
   gh auth login
   ```

3. **Create a new repository**:
   ```bash
   gh repo create byGodsgrace-retailer-system --public --description "Retailer Management System with Supabase integration"
   ```

4. **Add remote and push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/byGodsgrace-retailer-system.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Using GitHub Web Interface

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `byGodsgrace-retailer-system`
4. Description: "Retailer Management System with Supabase integration"
5. Choose "Public" or "Private"
6. **Don't** initialize with README (we already have one)
7. Click "Create repository"
8. Follow the instructions shown for "push an existing repository"

## 🌐 Step 2: Deploy to Netlify

### Option A: Connect GitHub Repository (Recommended)

1. **Go to Netlify**:
   - Visit [netlify.com](https://netlify.com)
   - Sign up/Login with your GitHub account

2. **Deploy from Git**:
   - Click "New site from Git"
   - Choose "GitHub" as your Git provider
   - Authorize Netlify to access your GitHub account
   - Select your `byGodsgrace-retailer-system` repository

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

4. **Set Environment Variables**:
   - Go to Site settings → Environment variables
   - Add the following variables:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```

### Option B: Manual Deploy

1. **Build your project locally**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

## 🔧 Step 3: Configure Custom Domain (Optional)

1. **In Netlify Dashboard**:
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain name
   - Follow the DNS configuration instructions

2. **DNS Configuration**:
   - Add a CNAME record pointing to your Netlify site
   - Or use Netlify's nameservers for full DNS management

## 🔄 Step 4: Continuous Deployment

### Automatic Deployments

Once connected to GitHub, Netlify will automatically:
- Deploy when you push to the `main` branch
- Create preview deployments for pull requests
- Show deployment status in GitHub

### Manual Deployments

You can also trigger manual deployments:
```bash
# Deploy current branch
netlify deploy --prod

# Deploy specific branch
netlify deploy --prod --branch=feature-branch
```

## 🛠️ Step 5: Environment Setup

### Local Development

Create a `.env.local` file for local development:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Production Environment

Set these in Netlify's environment variables:
1. Go to Site settings → Environment variables
2. Add each variable with your production Supabase credentials

## 📊 Step 6: Monitoring & Analytics

### Netlify Analytics

1. **Enable Analytics**:
   - Go to Site settings → Analytics
   - Enable "Netlify Analytics"

2. **View Metrics**:
   - Page views, unique visitors
   - Performance metrics
   - Error tracking

### Custom Analytics

Consider adding:
- Google Analytics
- Sentry for error tracking
- Custom performance monitoring

## 🔒 Step 7: Security & Performance

### Security Headers

The `netlify.toml` file includes security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### Performance Optimization

- Static assets are cached for 1 year
- JavaScript and CSS files are optimized
- Code splitting for better loading times

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Netlify dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Environment Variables**:
   - Double-check variable names (must start with `VITE_`)
   - Ensure values are correct
   - Redeploy after adding variables

3. **Routing Issues**:
   - The `netlify.toml` includes SPA redirects
   - All routes redirect to `index.html`

4. **Supabase Connection**:
   - Verify Supabase project is active
   - Check RLS policies are configured
   - Ensure API keys are correct

### Getting Help

- Check Netlify documentation: [docs.netlify.com](https://docs.netlify.com)
- GitHub issues: Create an issue in your repository
- Netlify support: Available in the dashboard

## 🎉 Success!

Once deployed, your application will be available at:
- Netlify URL: `https://your-site-name.netlify.app`
- Custom domain: `https://your-domain.com` (if configured)

### Next Steps

1. **Test the deployment**:
   - Verify all features work correctly
   - Test authentication flows
   - Check mobile responsiveness

2. **Set up monitoring**:
   - Enable error tracking
   - Set up performance monitoring
   - Configure alerts

3. **Share your work**:
   - Update the README with your live URL
   - Share with stakeholders
   - Get feedback and iterate

---

**Congratulations!** Your Retailer Management System is now live on the web! 🚀 