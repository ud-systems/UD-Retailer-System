import { supabaseAuthService } from './supabaseAuthService';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, hasAdminAccess } from '@/integrations/supabase/adminClient';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer' | 'salesperson';
  created_by: string;
  created_at: Date;
  last_login?: Date;
  status: 'active' | 'inactive' | 'pending';
  profilePicture?: string;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'viewer' | 'salesperson';
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  admins: number;
  managers: number;
  viewers: number;
  salespersons: number;
}

class UserService {
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Connection test error:', error);
        return false;
      }
      
      console.log('Connection test successful');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data?.map(profile => ({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role as 'admin' | 'manager' | 'viewer' | 'salesperson',
        created_by: profile.created_by || 'system',
        created_at: new Date(profile.created_at),
        last_login: profile.last_login ? new Date(profile.last_login) : undefined,
        status: profile.status as 'active' | 'inactive' | 'pending',
        profilePicture: profile.profile_picture || '',
      })) || [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      return [];
    }
  }

  async validateLogin(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const result = await supabaseAuthService.login({ username, password });
      return { success: true, user: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async createUser(userData: CreateUserData, createdBy: string): Promise<User> {
    try {
      console.log('Creating user with data:', userData);
      
      // First, check if the user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .or(`email.eq.${userData.email},username.eq.${userData.username}`)
        .single();

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Since profiles table has a foreign key constraint to auth.users,
      // we need to create the auth user first, then create the profile
      // We'll use a different approach: create a pending profile entry
      // that will be linked when the user signs up

      // Create a temporary profile entry in a different way
      // We'll use a serverless function or edge function for this
      // For now, let's create a simpler approach using the existing trigger system

      // Check if we have admin access for user creation
      if (!hasAdminAccess() || !supabaseAdmin) {
        console.warn('Admin access not available - user creation requires admin privileges');
        throw new Error('User creation requires admin privileges. Please contact an administrator to set up the service role key.');
      }

      // Use admin client to create auth user first
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          username: userData.username,
          role: userData.role
        },
        email_confirm: true
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user in authentication system');
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Wait for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if the profile was created by the trigger
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileFetchError || !profile) {
        console.error('Profile not found after creation:', profileFetchError);
        throw new Error('Profile was not created automatically. Please try again.');
      }

      console.log('Profile created successfully by trigger');
      
      // Update the profile to ensure correct role and created_by
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          created_by: createdBy,
          status: 'active'
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Error updating profile after creation:', updateError);
        // Don't throw error here as the user was created successfully
      }
      
      return {
        id: authData.user.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        created_by: createdBy,
        created_at: new Date(),
        status: 'active',
        profilePicture: '',
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      console.log('Updating user:', id, 'with updates:', updates);
      
      // Update the profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          email: updates.email,
          role: updates.role,
          status: updates.status,
          profile_picture: updates.profilePicture,
        })
        .eq('id', id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        return false;
      }

      // If email is being updated, also update it in the auth.users table
      if (updates.email) {
        try {
          const { error: authError } = await supabase.auth.admin.updateUserById(id, {
            email: updates.email,
            email_confirm: true
          });

          if (authError) {
            console.error('Error updating user email in auth:', authError);
            // Don't fail the entire update if auth update fails
            // The profile update was successful
          } else {
            console.log('User email updated in auth system');
          }
        } catch (authUpdateError) {
          console.error('Error updating auth email:', authUpdateError);
          // Continue with the update even if auth update fails
        }
      }

      console.log('User updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return false;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log('Deleting user:', id);
      
      // First, check if user exists
      const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, username')
        .eq('id', id)
        .single();

      if (fetchError || !user) {
        console.error('User not found for deletion:', fetchError);
        return false;
      }

      // Try to delete from auth.users if admin access is available
      let authDeleted = false;
      if (hasAdminAccess() && supabaseAdmin) {
        try {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
          
          if (authDeleteError) {
            console.warn('Warning: Could not delete user from auth system:', authDeleteError);
          } else {
            console.log('User deleted from auth system');
            authDeleted = true;
          }
        } catch (authError) {
          console.warn('Warning: Auth deletion failed:', authError);
        }
      } else {
        console.log('Admin access not available - will only delete profile');
      }

      // Delete from profiles table (this will work with anon key due to RLS policies)
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileDeleteError) {
        console.error('Error deleting user from profiles:', profileDeleteError);
        return false;
      }

      if (authDeleted) {
        console.log(`User "${user.username}" deleted successfully from both auth and profiles`);
      } else {
        console.log(`User "${user.username}" deleted from profiles - auth record may still exist`);
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return false;
    }
  }

  async toggleUserStatus(id: string): Promise<boolean> {
    try {
      // First get current status
      const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching user status:', fetchError);
        return false;
      }

      const newStatus = user.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error toggling user status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleUserStatus:', error);
      return false;
    }
  }

  async getUsersByRole(role: User['role']): Promise<User[]> {
    try {
      const users = await this.getUsers();
      return users.filter(user => user.role === role);
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      return [];
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const users = await this.getUsers();
      
      const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        pending: users.filter(u => u.status === 'pending').length,
        admins: users.filter(u => u.role === 'admin').length,
        managers: users.filter(u => u.role === 'manager').length,
        viewers: users.filter(u => u.role === 'viewer').length,
        salespersons: users.filter(u => u.role === 'salesperson').length,
      };

      return stats;
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        admins: 0,
        managers: 0,
        viewers: 0,
        salespersons: 0,
      };
    }
  }

  // Legacy methods for backward compatibility
  saveUsers(users: User[]): void {
    console.warn('saveUsers is deprecated with Supabase migration');
  }

  updateUserProfile(userId: string, updates: any): { success: boolean; error?: string } {
    console.warn('updateUserProfile is deprecated - use updateUser instead');
    return { success: true };
  }

  signupUser(userData: CreateUserData): User {
    console.warn('signupUser is deprecated - use createUser instead');
    return this.createUser(userData, 'signup') as any;
  }

  approveUser(id: string): boolean {
    console.warn('approveUser is deprecated - use updateUser with status active');
    return true;
  }
}

export const userService = new UserService();
