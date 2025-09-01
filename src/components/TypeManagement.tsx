import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categoryService } from '../services/categoryService';
import type { ProductType } from '../services/supabaseProductService';

const TypeManagement = () => {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [newType, setNewType] = useState({ name: '', description: '', color: '#6B7280' });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await categoryService.getTypes();
      setTypes(data);
    } catch (error) {
      console.error('Failed to load product types:', error);
      toast({
        title: "Error",
        description: "Failed to load product types.",
        variant: "destructive",
      });
    }
  };

  const handleAddType = async () => {
    if (!newType.name) {
      toast({
        title: "Validation Error",
        description: "Product type name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add product types.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await categoryService.addType({
        ...newType,
        created_by: user.username || 'unknown',
        is_active: true
      });

      await loadTypes();
      setNewType({ name: '', description: '', color: '#6B7280' });
      setShowAddDialog(false);
      
      toast({
        title: "Product Type Added",
        description: `${newType.name} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding product type:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product type.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditType = async () => {
    if (!editingType || !editingType.name) {
      toast({
        title: "Validation Error",
        description: "Product type name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await categoryService.updateType(editingType.id, editingType);

      await loadTypes();
      setEditingType(null);
      setShowEditDialog(false);
      
      toast({
        title: "Product Type Updated",
        description: `${editingType.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating product type:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product type.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteType = async (id: string, typeName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${typeName}? This will affect all products using this type.`)) {
      return;
    }

    try {
      await categoryService.deleteType(id);
      await loadTypes();
      
      toast({
        title: "Product Type Deleted",
        description: `${typeName} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting product type:', error);
      toast({
        title: "Error",
        description: "Failed to delete product type.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (type: ProductType) => {
    setEditingType(type);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Product Types</span>
            </CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm text-gray-500">{type.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>{type.created_by}</TableCell>
                  <TableCell>{new Date(type.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(type)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteType(type.id, type.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Type Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent aria-describedby="add-type-description">
          <DialogHeader>
            <DialogTitle>Add New Product Type</DialogTitle>
          </DialogHeader>
          <div id="add-type-description" className="sr-only">
            Fill out the form to add a new product type. All fields are required.
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type-name">Type Name</Label>
              <Input
                id="type-name"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                placeholder="Enter type name"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="type-description">Description</Label>
              <Input
                id="type-description"
                value={newType.description}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                placeholder="Enter description"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="type-color">Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="type-color"
                  type="color"
                  value={newType.color}
                  onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                  disabled={isLoading}
                  className="w-20"
                />
                <Input
                  value={newType.color}
                  onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                  placeholder="#6B7280"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddType} className="bg-theme-primary text-white hover:bg-theme-primary/90" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Type'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Type Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type-name">Type Name</Label>
              <Input
                id="edit-type-name"
                value={editingType?.name || ''}
                onChange={(e) => setEditingType(editingType ? { ...editingType, name: e.target.value } : null)}
                placeholder="Enter type name"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="edit-type-description">Description</Label>
              <Input
                id="edit-type-description"
                value={editingType?.description || ''}
                onChange={(e) => setEditingType(editingType ? { ...editingType, description: e.target.value } : null)}
                placeholder="Enter description"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="edit-type-color">Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="edit-type-color"
                  type="color"
                  value={editingType?.color || '#6B7280'}
                  onChange={(e) => setEditingType(editingType ? { ...editingType, color: e.target.value } : null)}
                  disabled={isLoading}
                  className="w-20"
                />
                <Input
                  value={editingType?.color || '#6B7280'}
                  onChange={(e) => setEditingType(editingType ? { ...editingType, color: e.target.value } : null)}
                  placeholder="#6B7280"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditType} className="bg-theme-primary text-white hover:bg-theme-primary/90" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Type'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TypeManagement; 