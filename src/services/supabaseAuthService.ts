import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { rateLimitService } from './rateLimitService';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Interface to match current User interface exactly
interface LegacyUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer' | 'salesperson';
  lastLogin: Date;
  profilePicture?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

class SupabaseAuthService {
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  async login(credentials: LoginCredentials): Promise<LegacyUser> {
    console.log('Login attempt for:', credentials.username);
    
    // Check rate limiting for login attempts
    const clientKey = rateLimitService.getClientKey();
    const rateLimit = rateLimitService.checkRateLimit(clientKey, 'login');
    
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toLocaleTimeString();
      throw new Error(`Too many login attempts. Please try again after ${resetTime}.`);
    }
    
    // First, get the user's email from their username (which is actually email)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.eq.${credentials.username},email.eq.${credentials.username}`)
      .eq('status', 'active')
      .single();

    if (profileError || !profiles) {
      console.log('Profile not found, attempting direct auth with email...');
      // If profile doesn't exist, try direct authentication with email
      // This handles the case where the admin user exists in auth but not in profiles
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Provide more specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and confirm your account before logging in.');
        } else if (authError.message.includes('User not found')) {
          throw new Error('Account not found. Please check your email address or contact an administrator.');
        } else {
          throw new Error(`Authentication failed: ${authError.message}`);
        }
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Check if this is the admin user that needs a profile created
      if (authData.user.email === 'iankatana51@gmail.com') {
        console.log('Checking if admin profile exists...');
        
        // First check if profile already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing profile:', checkError);
        }

        if (!existingProfile) {
          console.log('Creating missing admin profile...');
          
          // Create the missing profile
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username: authData.user.email,
              email: authData.user.email,
              role: 'admin',
              created_by: 'system',
              status: 'active'
            });

          if (createProfileError) {
            console.error('Error creating admin profile:', createProfileError);
            // Continue anyway since auth succeeded
          } else {
            console.log('Admin profile created successfully');
          }
        } else {
          console.log('Admin profile already exists');
        }

        // Update last login
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authData.user.id);

        return {
          id: authData.user.id,
          username: authData.user.email,
          email: authData.user.email,
          role: 'admin',
          lastLogin: new Date(),
          profilePicture: ''
        };
      } else {
        throw new Error('User profile not found. Please contact an administrator.');
      }
    }

    // Use the email to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: profiles.email,
      password: credentials.password
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Provide more specific error messages
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (authError.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before logging in.');
      } else if (authError.message.includes('User not found')) {
        throw new Error('Account not found. Please check your email address or contact an administrator.');
      } else {
        throw new Error(`Authentication failed: ${authError.message}`);
      }
    }

    if (!authData.user) {
      throw new Error('Authentication failed');
    }

    // Update last login
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    const userData: LegacyUser = {
      id: profiles.id,
      username: profiles.username,
      email: profiles.email,
      role: profiles.role as 'admin' | 'manager' | 'viewer' | 'salesperson',
      lastLogin: new Date(),
      profilePicture: profiles.profile_picture || ''
    };

    return userData;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    // Clear any additional local storage if needed
    localStorage.removeItem('googleSheetsConfig');
    localStorage.removeItem('adminSettings');
  }

  async getCurrentUser(): Promise<LegacyUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user profile:', error);
        return null;
      }

      if (!profile) return null;

      return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role as 'admin' | 'manager' | 'viewer' | 'salesperson',
        lastLogin: profile.last_login ? new Date(profile.last_login) : new Date(),
        profilePicture: profile.profile_picture || ''
      };
    } catch (error) {
      console.warn('Error in getCurrentUser:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  }

  async hasRole(requiredRole: LegacyUser['role']): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy = { salesperson: 1, viewer: 1, manager: 2, admin: 3 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  async extendSession(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Supabase handles session refresh automatically
      await supabase.auth.refreshSession();
    }
  }

  // For backward compatibility, these methods will work with Supabase Auth
  async setUserPassword(username: string, password: string): Promise<void> {
    // This would require admin privileges to update another user's password
    // For now, we'll log this as it's mainly used for user creation
    console.log(`Password set for user: ${username}`);
  }

  async removeUserPassword(username: string): Promise<void> {
    // This would be handled by user deletion in Supabase
    console.log(`Password removed for user: ${username}`);
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  // Method to create a new user account (for admin use)
  async createUser(email: string, password: string, userData: { username: string; role: LegacyUser['role'] }): Promise<void> {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        username: userData.username
      }
    });

    if (error) throw error;

    // The profile will be created automatically by the trigger
    // But we can update the role if needed
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ 
          role: userData.role,
          status: 'active'
        })
        .eq('id', data.user.id);
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
