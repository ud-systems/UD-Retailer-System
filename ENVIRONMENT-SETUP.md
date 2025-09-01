# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://tpdhcesneddslwauqyzu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTgzMjksImV4cCI6MjA2NjQzNDMyOX0.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A

# Service Role Key (for admin operations - KEEP SECURE!)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg1ODMyOSwiZXhwIjoyMDY2NDM0MzI5fQ.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A

# Development Settings
VITE_APP_ENV=development
```

## Security Warning

⚠️ **IMPORTANT**: 
- The service role key has full admin access to your database
- Never commit this key to version control
- Only use in development/testing environments
- For production, use server-side functions instead

## How to Set Up

### Option 1: Create .env.local file

1. Create a file named `.env.local` in your project root
2. Copy the content above into the file
3. Save the file
4. Restart your development server

### Option 2: Use PowerShell (Windows)

```powershell
# Create the environment file
New-Item -Path ".env.local" -ItemType File -Force
Add-Content -Path ".env.local" -Value "VITE_SUPABASE_URL=https://tpdhcesneddslwauqyzu.supabase.co"
Add-Content -Path ".env.local" -Value "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTgzMjksImV4cCI6MjA2NjQzNDMyOX0.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A"
Add-Content -Path ".env.local" -Value "VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg1ODMyOSwiZXhwIjoyMDY2NDM0MzI5fQ.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A"
Add-Content -Path ".env.local" -Value "VITE_APP_ENV=development"
```

### Option 3: Use Command Line (Linux/Mac)

```bash
# Create the environment file
cat > .env.local << EOF
VITE_SUPABASE_URL=https://tpdhcesneddslwauqyzu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTgzMjksImV4cCI6MjA2NjQzNDMyOX0.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg1ODMyOSwiZXhwIjoyMDY2NDM0MzI5fQ.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A
VITE_APP_ENV=development
EOF
```

## Verification

After setting up the environment variables:

1. **Restart your development server**
2. **Check the browser console** for any environment-related errors
3. **Try creating a user** - it should work without localStorage errors
4. **Verify admin access** - check that `hasAdminAccess()` returns true

## Troubleshooting

### Environment Variables Not Loading

1. **Check file name** - Must be exactly `.env.local`
2. **Check file location** - Must be in project root (same level as package.json)
3. **Restart server** - Environment variables require server restart
4. **Check syntax** - No spaces around `=` sign

### Service Role Key Issues

1. **Verify key format** - Should be a long JWT token
2. **Check Supabase dashboard** - Verify the key is correct
3. **Test connection** - Use the test scripts to verify

### Still Getting localStorage Errors

1. **Clear browser cache** - Hard refresh (Ctrl+F5)
2. **Check for old code** - Ensure no localStorage references remain
3. **Verify imports** - Check that admin client is imported correctly

## Production Deployment

For production, **DO NOT** use the service role key in the browser. Instead:

1. **Use server-side functions** for admin operations
2. **Set up Supabase Edge Functions** for user management
3. **Use RLS policies** for data access control
4. **Remove service role key** from client-side code

This setup is for **development and testing only**. 