import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { Loader2, User, Mail, Shield } from 'lucide-react';
import { supabaseAuthService } from '../services/supabaseAuthService';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdate?: () => void;
}

interface ProfileFormData {
  username: string;
  email: string;
  role: string;
}

const UserProfileDialog = ({ open, onOpenChange, onProfileUpdate }: UserProfileDialogProps) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    role: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original user data
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update user in database
      const success = await userService.updateUser(user.id, {
        username: formData.username,
        email: formData.email,
        role: formData.role as 'admin' | 'manager' | 'viewer' | 'salesperson'
      });

      if (success) {
        // Refresh user data from database to ensure we have the latest data
        try {
          const refreshedUser = await supabaseAuthService.getCurrentUser();
          if (refreshedUser) {
            updateUser(refreshedUser);
          } else {
            // Fallback to local update if refresh fails
            const updatedUser = {
              ...user,
              username: formData.username,
              email: formData.email
            };
            updateUser(updatedUser);
          }
        } catch (refreshError) {
          console.warn('Failed to refresh user data, using local update:', refreshError);
          // Fallback to local update
          const updatedUser = {
            ...user,
            username: formData.username,
            email: formData.email
          };
          updateUser(updatedUser);
        }
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        
        setIsEditing(false);
        
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        throw new Error('Failed to update profile in database');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'viewer': return 'Viewer';
      case 'salesperson': return 'Salesperson';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'salesperson': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Loading user profile...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="user-profile-description"
      >
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div id="user-profile-description" className="sr-only">
          View and edit your user profile information including username, email, and role.
        </div>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-theme-primary/10">
              <User className="h-8 w-8 text-theme-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.username}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                <Shield className="mr-1 h-3 w-3" />
                {getRoleDisplayName(user.role)}
              </span>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Username
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!isEditing || isLoading}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing || isLoading}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="role" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Role
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={true} // Role cannot be changed by user
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="salesperson">Salesperson</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Role can only be changed by an administrator</p>
            </div>

            <div className="text-sm text-gray-500">
              <p>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            {!isEditing ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button 
                  type="button" 
                  onClick={handleEdit}
                  className="bg-theme-primary text-white hover:bg-theme-primary/90"
                >
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSave}
                  className="bg-theme-primary text-white hover:bg-theme-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
