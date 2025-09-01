import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { productService } from '../services/productService';
import { ProductCategory, ProductType, Product } from '../services/supabaseProductService';
import { Loader2 } from 'lucide-react';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductUpdated: () => void;
}

const EditProductDialog = ({ open, onOpenChange, product, onProductUpdated }: EditProductDialogProps) => {
  console.log('EditProductDialog props:', { open, product });
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
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCategoriesAndTypes();
    }
  }, [open]);

  useEffect(() => {
    if (product) {
      console.log('Setting form data for product:', product);
      setFormData({
        product_name: product.product_name || '',
        product_type: product.product_type || '',
        category: product.category || '',
        nicotine_strength: product.nicotine_strength || '',
        flavour: product.flavour || '',
        price: product.price ? product.price.toString() : '0'
      });
    }
  }, [product]);

  const loadCategoriesAndTypes = async () => {
    setIsLoadingData(true);
    try {
      const [categoriesData, typesData] = await Promise.all([
        productService.getCategories(),
        productService.getTypes()
      ]);
      setCategories(categoriesData);
      setTypes(typesData);
    } catch (error) {
      console.error('Failed to load categories and types:', error);
      toast({
        title: "Error",
        description: "Failed to load categories and types. Using fallback options.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
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
      const success = await productService.updateProduct(product.id, {
        product_name: formData.product_name,
        product_type: formData.product_type,
        category: formData.category,
        nicotine_strength: formData.nicotine_strength,
        flavour: formData.flavour,
        price: parseFloat(formData.price) || 0
      });
      
      if (success) {
        console.log('Product updated successfully');
        toast({
          title: "Product Updated",
          description: `${formData.product_name} has been updated successfully.`,
        });
        
        onOpenChange(false);
        onProductUpdated();
      } else {
        console.log('Product update failed');
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) {
    console.log('No product provided to EditProductDialog');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-describedby="edit-product-description"
      >
        <DialogHeader>
          <DialogTitle>Edit Product - {product.product_name}</DialogTitle>
        </DialogHeader>
        <div id="edit-product-description" className="sr-only">
          Edit product information. All fields marked with asterisks are required.
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-product_name">Product Name *</Label>
            <Input
              id="edit-product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="Enter product name"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-product_type">Product Type *</Label>
              <Select 
                value={formData.product_type} 
                onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                disabled={isLoading || isLoadingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingData ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
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
              <Label htmlFor="edit-category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={isLoading || isLoadingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingData ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
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
              <Label htmlFor="edit-nicotine_strength">Nicotine Strength</Label>
              <Input
                id="edit-nicotine_strength"
                value={formData.nicotine_strength}
                onChange={(e) => setFormData({ ...formData, nicotine_strength: e.target.value })}
                placeholder="e.g., 20mg"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-price">Price *</Label>
              <Input
                id="edit-price"
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
            <Label htmlFor="edit-flavour">Flavour</Label>
            <Input
              id="edit-flavour"
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
