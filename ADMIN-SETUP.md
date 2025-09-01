# Admin Setup Guide

## Complete User Deletion Setup

To enable complete user deletion (removing both profile and auth records), you need to set up a service role key.

### Option 1: Environment Variable (Recommended for Development)

1. Create a `.env` file in your project root:
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Get your service role key from Supabase:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "service_role" key (NOT the anon key)
   - Add it to your `.env` file

3. Restart your development server:
```bash
npm run dev
```

### Option 2: Manual Setup (For Production)

For production, you should handle admin operations server-side for security. The current setup will work but only delete profiles, not auth records.

### Current Behavior

- **With service role key**: Users are completely deleted from both profiles and auth
- **Without service role key**: Only profiles are deleted, auth records remain (users can't log in anyway)

### Security Note

⚠️ **Important**: The service role key has full admin access. Never expose it in client-side code in production. For production applications, handle admin operations server-side.

### Testing

You can test if admin access is working by checking the browser console when deleting a user. You should see either:
- "User deleted successfully from both auth and profiles" (admin access working)
- "User deleted from profiles - auth record may still exist" (no admin access) 