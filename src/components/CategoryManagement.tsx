import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tag, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categoryService } from '../services/categoryService';
import type { ProductCategory } from '../services/supabaseProductService';

const CategoryManagement = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#6B7280' });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add categories.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await categoryService.addCategory({
        ...newCategory,
        created_by: user.username || 'unknown',
        is_active: true
      });

      await loadCategories();
      setNewCategory({ name: '', description: '', color: '#6B7280' });
      setShowAddDialog(false);
      
      toast({
        title: "Category Added",
        description: `${newCategory.name} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add category.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await categoryService.updateCategory(editingCategory.id, editingCategory);

      await loadCategories();
      setEditingCategory(null);
      setShowEditDialog(false);
      
      toast({
        title: "Category Updated",
        description: `${editingCategory.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${categoryName}? This will affect all products using this category.`)) {
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      await loadCategories();
      
      toast({
        title: "Category Deleted",
        description: `${categoryName} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: ProductCategory) => {
    setEditingCategory(category);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <span>Product Categories</span>
            </CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary hover:bg-theme-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
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
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-500">{category.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>{category.created_by}</TableCell>
                  <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id, category.name)}
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

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent aria-describedby="add-category-description">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div id="add-category-description" className="sr-only">
            Fill out the form to add a new product category. All fields are required.
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Enter description"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="category-color">Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="category-color"
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  disabled={isLoading}
                  className="w-20"
                />
                <Input
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  placeholder="#6B7280"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} className="bg-theme-primary hover:bg-theme-primary/90" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={editingCategory?.name || ''}
                onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)}
                placeholder="Enter category name"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="edit-category-description">Description</Label>
              <Input
                id="edit-category-description"
                value={editingCategory?.description || ''}
                onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, description: e.target.value } : null)}
                placeholder="Enter description"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="edit-category-color">Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="edit-category-color"
                  type="color"
                  value={editingCategory?.color || '#6B7280'}
                  onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, color: e.target.value } : null)}
                  disabled={isLoading}
                  className="w-20"
                />
                <Input
                  value={editingCategory?.color || '#6B7280'}
                  onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, color: e.target.value } : null)}
                  placeholder="#6B7280"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditCategory} className="bg-theme-primary hover:bg-theme-primary/90" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement; 