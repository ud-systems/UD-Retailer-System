import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async () => {
  try {
    // Check if admin user already exists in profiles table
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'iankatana51@gmail.com')
      .single();

    if (existingProfile && !profileCheckError) {
      console.log('Admin user profile already exists');
      return { success: true, message: 'Admin user already exists' };
    }

    // Try to create a new admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'iankatana51@gmail.com',
      password: 'admin123456',
      options: {
        data: {
          username: 'iankatana51@gmail.com',
          role: 'admin'
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // Wait for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if the profile was created
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileFetchError || !profile) {
      console.error('Profile not found after creation:', profileFetchError);
      return { success: false, error: 'Profile was not created automatically' };
    }

    // Update the profile to ensure it has admin role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        created_by: 'system',
        status: 'active'
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // Don't return error here as the user was created successfully
      console.log('User created but profile update failed. Admin role may need to be set manually.');
    }

    return { success: true };

  } catch (error) {
    console.error('Error in createAdminUser:', error);
    return { success: false, error: 'Failed to create admin user' };
  }
};
