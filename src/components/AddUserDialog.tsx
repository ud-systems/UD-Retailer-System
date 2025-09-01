import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded?: () => void;
}

const AddUserDialog = ({ open, onOpenChange, onUserAdded }: AddUserDialogProps) => {
  const { hasRole } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: (hasRole('admin') ? 'viewer' : 'salesperson') as 'admin' | 'manager' | 'viewer' | 'salesperson'
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Creating user with form data:', formData);
    
    try {
      // Test connection first
      const connectionTest = await userService.testConnection();
      if (!connectionTest) {
        toast({
          title: "Connection Error",
          description: "Cannot connect to the database. Please check your connection.",
          variant: "destructive",
        });
        return;
      }

      const createdUser = await userService.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      }, 'admin');

      console.log('User created successfully:', createdUser);

      toast({
        title: "User Added",
        description: `${formData.username} has been added successfully with role: ${formData.role}`,
      });
      
      setFormData({
        username: '',
        email: '',
        password: '',
        role: (hasRole('admin') ? 'viewer' : 'salesperson') as 'admin' | 'manager' | 'viewer' | 'salesperson'
      });
      
      onOpenChange(false);
      
      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add user.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="add-user-description"
      >
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div id="add-user-description" className="sr-only">
          Fill out the form to add a new user to the system. All fields are required. The user will need to sign up with their email and password to activate their account.
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After creating the user profile, the user will need to sign up with their email and password on the Sign Up page to activate their account.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-theme-primary text-white hover:bg-theme-primary/90">
              Add User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
