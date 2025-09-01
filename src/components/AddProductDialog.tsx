import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { productService } from '../services/productService';
import { ProductCategory, ProductType } from '../services/supabaseProductService';
import { Loader2 } from 'lucide-react';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}

const AddProductDialog = ({ open, onOpenChange, onProductAdded }: AddProductDialogProps) => {
  const [formData, setFormData] = useState({
    product_name: '',
    product_type: '',
    category: '',
    nicotine_strength: '',
    flavour: '',
    price: ''
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCategoriesAndTypes();
    }
  }, [open]);

  const loadCategoriesAndTypes = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [categoriesData, typesData] = await Promise.all([
        productService.getCategories(),
        productService.getTypes()
      ]);
      
      // Filter out any items with empty names to prevent Select errors
      const validCategories = categoriesData.filter(cat => cat.name && cat.name.trim() !== '');
      const validTypes = typesData.filter(type => type.name && type.name.trim() !== '');
      
      setCategories(validCategories);
      setTypes(validTypes);
      
      if (validCategories.length === 0 || validTypes.length === 0) {
        setError('No categories or types available. Please add some in Admin Settings first.');
      }
    } catch (error) {
      console.error('Failed to load categories and types:', error);
      setError('Failed to load categories and types. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load categories and types. Please check Admin Settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_name || !formData.product_type || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await productService.addProduct({
        product_name: formData.product_name,
        product_type: formData.product_type,
        category: formData.category,
        nicotine_strength: formData.nicotine_strength,
        flavour: formData.flavour,
        price: parseFloat(formData.price) || 0
      });
      
      toast({
        title: "Product Added",
        description: `${formData.product_name} has been added successfully.`,
      });
      
      // Reset form
      setFormData({
        product_name: '',
        product_type: '',
        category: '',
        nicotine_strength: '',
        flavour: '',
        price: ''
      });
      
      onOpenChange(false);
      
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-describedby="add-product-description"
      >
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the product details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div id="add-product-description" className="sr-only">
          Add a new product to the system. Fill in all required fields marked with asterisks.
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product_name">Product Name *</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="Enter product name"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_type">Product Type *</Label>
              <Select 
                value={formData.product_type} 
                onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                disabled={isLoading || isLoadingData || types.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={types.length === 0 ? "No types available" : "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingData ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : types.length === 0 ? (
                    <SelectItem value="none" disabled>No types available</SelectItem>
                  ) : (
                    types.map(type => (
                      <SelectItem key={type.id} value={type.name}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={isLoading || isLoadingData || categories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingData ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="none" disabled>No categories available</SelectItem>
                  ) : (
                    categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nicotine_strength">Nicotine Strength</Label>
              <Input
                id="nicotine_strength"
                value={formData.nicotine_strength}
                onChange={(e) => setFormData({ ...formData, nicotine_strength: e.target.value })}
                placeholder="e.g., 20mg"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="flavour">Flavour</Label>
            <Input
              id="flavour"
              value={formData.flavour}
              onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
              placeholder="Enter flavour"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || categories.length === 0 || types.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Product...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
