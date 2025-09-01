# Authentication Setup Guide

## Current Issue
The authentication system has a mismatch between the `profiles` table and the `auth.users` table. Users exist in profiles but not in the auth system.

## Quick Fix

### Option 1: Automated Fix (Recommended)

1. **Get your service role key** from Supabase:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "service_role" key (NOT the anon key)

2. **Create a `.env` file** in your project root:
   ```
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Run the fix script**:
   ```bash
   node fix-authentication.js
   ```

4. **Login with the temporary password**:
   - Email: `iankatana51@gmail.com`
   - Password: `TempPassword123!`

5. **Change the password** immediately after login

### Option 2: Manual Fix

If you can't get the service role key, you can manually create the auth user:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter the email: `iankatana51@gmail.com`
4. Set a password
5. Make sure "Email confirmed" is checked
6. Save the user

## Testing Authentication

Run the authentication test to verify everything is working:

```bash
node test-authentication.js
```

## Common Authentication Issues

### 1. "Invalid login credentials"
- **Cause**: User exists in profiles but not in auth system
- **Solution**: Run the fix script or manually create auth user

### 2. "Email not confirmed"
- **Cause**: User exists but email isn't verified
- **Solution**: Confirm email or disable email confirmation in Supabase settings

### 3. "User profile not found"
- **Cause**: User exists in auth but not in profiles
- **Solution**: Create profile manually or fix the trigger

### 4. RLS Policy Issues
- **Cause**: Row Level Security blocking access
- **Solution**: Check and fix RLS policies in database

## Security Notes

⚠️ **Important**: 
- The service role key has full admin access
- Never expose it in client-side code in production
- For production, handle admin operations server-side
- Change the temporary password immediately after first login

## Next Steps

After fixing authentication:

1. Test login functionality
2. Test user creation (requires admin privileges)
3. Test password reset functionality
4. Verify all authentication flows work correctly

## Support

If you continue to have issues:
1. Check the browser console for error messages
2. Run the authentication test script
3. Verify your Supabase configuration
4. Check RLS policies in your database 