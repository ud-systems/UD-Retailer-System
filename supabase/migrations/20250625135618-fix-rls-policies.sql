-- Fix RLS policies to allow user creation
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create new policies that allow proper user management
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

-- Allow the trigger function to insert new profiles (this is handled by SECURITY DEFINER)
-- The handle_new_user function already has SECURITY DEFINER which bypasses RLS

-- Also fix the admin_settings policy to be more permissive for initial setup
DROP POLICY IF EXISTS "Admins can manage admin settings" ON public.admin_settings;

CREATE POLICY "Admins can manage admin settings" ON public.admin_settings 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR 
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') -- Allow if no admin exists yet
); 