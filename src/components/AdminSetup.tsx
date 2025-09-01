
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createAdminUser } from '../utils/createAdminUser';
import { UserPlus, CheckCircle } from 'lucide-react';

const AdminSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const { toast } = useToast();

  const handleCreateAdmin = async () => {
    setIsCreating(true);
    
    try {
      const result = await createAdminUser();
      
      if (result.success) {
        setIsCreated(true);
        toast({
          title: "Admin User Created",
          description: "Admin user has been created successfully. You can now login with iankatana51@gmail.com / admin123456",
        });
      } else {
        toast({
          title: "Failed to Create Admin",
          description: result.error || "Failed to create admin user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isCreated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Admin User Created!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Your admin user has been created successfully.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium">Login Credentials:</p>
            <p className="text-sm">Email: iankatana51@gmail.com</p>
            <p className="text-sm">Password: admin123456</p>
          </div>
          <p className="text-xs text-gray-500">
            Please use these credentials to log in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 bg-theme-primary rounded-full flex items-center justify-center mb-4">
          <UserPlus className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Setup Admin User</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          No admin user found. Create an admin user to get started with the application.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">Admin credentials will be:</p>
          <p className="text-sm text-blue-700">Email: iankatana51@gmail.com</p>
          <p className="text-sm text-blue-700">Password: admin123456</p>
        </div>

        <Button
          onClick={handleCreateAdmin}
          disabled={isCreating}
          className="w-full bg-theme-primary hover:bg-theme-primary/90"
        >
          {isCreating ? 'Creating Admin User...' : 'Create Admin User'}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          You can change these credentials after logging in.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminSetup;
