import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { userService } from '../services/userService';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import AddUserDialog from '../components/AddUserDialog';
import EditUserDialog from '../components/EditUserDialog';

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

interface UserStats {
  active: number;
  inactive: number;
  admins: number;
  salespersons: number;
}

const UserManagement = () => {
  const { user: currentUser, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ active: 0, inactive: 0, admins: 0, salespersons: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('manager')) {
      return;
    }
    loadUsers();
    loadUserStats();
  }, [hasRole]);

  const loadUsers = async () => {
    try {
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await userService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    // Managers can only see salespersons, admins can see all users
    const hasPermission = hasRole('admin') || (hasRole('manager') && user.role === 'salesperson');
    
    return matchesSearch && matchesRole && matchesStatus && hasPermission;
  });

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'salesperson':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    const confirmMessage = `Are you sure you want to PERMANENTLY DELETE the user "${userToDelete.username}" (${userToDelete.email})?\n\nThis will remove the user's profile and access to the system. The user will no longer be able to log in.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        console.log('Attempting to delete user:', userId);
        const success = await userService.deleteUser(userId);
        if (success) {
          toast({
            title: "User Deleted",
            description: `User "${userToDelete.username}" has been removed from the system and can no longer log in.`,
          });
          loadUsers();
          loadUserStats();
        } else {
          console.error('Delete operation returned false');
          toast({
            title: "Error",
            description: "Failed to delete user. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error in handleDelete:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete user.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const success = await userService.toggleUserStatus(userId);
      if (success) {
        toast({
          title: "Status Updated",
          description: "User status has been updated.",
        });
        loadUsers();
        loadUserStats();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  if (!hasRole('admin') && !hasRole('manager')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <Navigation />
        
        <main className="p-6">
          <div className="text-center py-12">
            <UserX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access user management.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage system users, roles, and permissions</p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-4 sm:space-x-4">
            <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-theme-primary" />
              <span className="text-2xl font-bold text-theme-primary">{users.length}</span>
              <span className="text-gray-600">Total Users</span>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats.active}</p>
                  <p className="text-gray-600">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserX className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats.inactive}</p>
                  <p className="text-gray-600">Inactive Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats.admins}</p>
                  <p className="text-gray-600">Administrators</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userStats.salespersons}</p>
                  <p className="text-gray-600">Sales Team</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Users</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Roles</option>
                {hasRole('admin') && <option value="admin">Admin</option>}
                {hasRole('admin') && <option value="manager">Manager</option>}
                <option value="salesperson">Salesperson</option>
                {hasRole('admin') && <option value="viewer">Viewer</option>}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </CardHeader>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                            className={user.status === 'active' ? 'text-red-600' : 'text-green-600'}
                          >
                            {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            title="Permanently delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <AddUserDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onUserAdded={() => {
            loadUsers();
            loadUserStats();
          }}
        />

        <EditUserDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          user={editingUser}
          onUserUpdated={() => {
            loadUsers();
            loadUserStats();
          }}
        />
      </main>
    </div>
  );
};

export default UserManagement;
