# Supabase User Management Guide

## Current Implementation

The application now uses a **secure, proper Supabase approach** for user management:

### How It Works

1. **Admin creates user profile** - Admin users can create profiles in the `profiles` table using RLS policies
2. **User signs up for auth** - The new user must sign up on the Sign Up page with their email and password
3. **Automatic linking** - When the user signs up, Supabase triggers automatically link the profile to the auth user

### Security Benefits

✅ **No service role key in browser** - Completely secure  
✅ **RLS policies enforced** - Only admins can create users  
✅ **Proper authentication flow** - Users must sign up themselves  
✅ **No localStorage hacks** - Clean, production-ready code  

## User Creation Process

### For Administrators

1. **Navigate to User Management**
2. **Click "Add User"**
3. **Fill in the form:**
   - Username
   - Email
   - Password (for reference)
   - Role (admin, manager, salesperson, viewer)
4. **Click "Add User"**
5. **Profile is created** - User appears in the list with "active" status

### For New Users

1. **Receive credentials** from administrator
2. **Go to Sign Up page**
3. **Sign up with their email and password**
4. **Account is automatically linked** to their profile
5. **Can now log in** and access the system

## Technical Details

### RLS Policies

The system uses these RLS policies for the `profiles` table:

```sql
-- Allow all authenticated users to view profiles
CREATE POLICY "Users can view all profiles" ON public.profiles 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Allow admins to manage all profiles (insert, update, delete)
CREATE POLICY "Admins can manage all profiles" ON public.profiles 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### Database Triggers

When a user signs up, Supabase automatically:
1. Creates the auth user
2. Triggers the `handle_new_user()` function
3. Links the profile to the auth user by ID

## Troubleshooting

### User Creation Fails

**Error:** "You do not have permission to create users"

**Solution:** 
- Ensure you are logged in as an admin user
- Check that your user profile has `role = 'admin'`
- Verify RLS policies are properly applied

### User Can't Sign Up

**Error:** "User already exists"

**Solution:**
- Check if the email is already used in auth.users
- Check if the username is already used in profiles
- Use a different email/username

### Profile Not Linked

**Issue:** User signed up but profile shows as unlinked

**Solution:**
- Check if the trigger function is working
- Verify the profile exists with the correct email
- Manually link the profile if needed

## Best Practices

### For Development

1. **Test with admin user** - Always test user creation as an admin
2. **Check RLS policies** - Ensure policies are applied correctly
3. **Monitor triggers** - Verify trigger functions work as expected

### For Production

1. **Secure admin accounts** - Use strong passwords for admin users
2. **Monitor user creation** - Log all user creation activities
3. **Regular audits** - Review user roles and permissions regularly
4. **Backup profiles** - Regular backups of the profiles table

## Migration from Old System

If you were using the localStorage approach:

1. **Remove localStorage code** - Already done
2. **Clear browser storage** - Remove any stored service role keys
3. **Test user creation** - Verify the new flow works
4. **Update documentation** - Share this guide with your team

## Support

If you encounter issues:

1. **Check browser console** for error messages
2. **Verify Supabase connection** in the dashboard
3. **Test RLS policies** with direct database queries
4. **Review trigger functions** in Supabase dashboard

This implementation is **production-ready** and follows Supabase best practices for security and user management. 