import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

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

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated?: () => void;
}

const EditUserDialog = ({ open, onOpenChange, user, onUserUpdated }: EditUserDialogProps) => {
  const { hasRole } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'viewer' as 'admin' | 'manager' | 'viewer' | 'salesperson',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user && open) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    console.log('Submitting user update:', { userId: user.id, formData });

    try {
      const success = await userService.updateUser(user.id, formData);

      if (success) {
        toast({
          title: "User Updated",
          description: `${formData.username} has been updated successfully.`,
        });
        
        onOpenChange(false);
        
        if (onUserUpdated) {
          onUserUpdated();
        }
      } else {
        console.error('User update returned false');
        toast({
          title: "Error",
          description: "Failed to update user. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="edit-user-description"
      >
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div id="edit-user-description" className="sr-only">
          Edit user information. All fields are required.
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hasRole('admin') && <SelectItem value="admin">Admin</SelectItem>}
                {hasRole('admin') && <SelectItem value="manager">Manager</SelectItem>}
                <SelectItem value="salesperson">Salesperson</SelectItem>
                {hasRole('admin') && <SelectItem value="viewer">Viewer</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-theme-primary text-white hover:bg-theme-primary/90">
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
