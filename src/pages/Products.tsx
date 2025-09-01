import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Package, Plus, Trash2, Edit } from 'lucide-react';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import AddProductDialog from '../components/AddProductDialog';
import EditProductDialog from '../components/EditProductDialog';
import type { Product } from '../services/supabaseProductService';
import { Label } from '@/components/ui/label';

const Products = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    loadProducts();
    
    const handleDataChange = (event: any) => {
      if (event.detail?.type === 'products' || !event.detail) {
        loadProducts();
      }
    };
    
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      console.log('Loaded products:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.flavour.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nicotine_strength.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || product.product_type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    // Price range filtering
    const productPrice = product.price;
    const minPrice = priceRangeFilter.min ? parseFloat(priceRangeFilter.min) : 0;
    const maxPrice = priceRangeFilter.max ? parseFloat(priceRangeFilter.max) : Infinity;
    const matchesPrice = productPrice >= minPrice && productPrice <= maxPrice;
    
    return matchesSearch && matchesType && matchesCategory && matchesPrice;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'Disposable':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Closed Pod':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Open System':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Disposable':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Refillable':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleEdit = (product: Product) => {
    if (!hasRole('manager')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit products.",
        variant: "destructive",
      });
      return;
    }
    console.log('Opening edit dialog for product:', product);
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasRole('manager')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete products.",
        variant: "destructive",
      });
      return;
    }
    if (window.confirm('Are you sure you want to delete this product?')) {
      const success = await productService.deleteProduct(id);
      if (success) {
        toast({
          title: "Product Deleted",
          description: "Product has been successfully deleted.",
        });
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(paginatedProducts.map(product => product.id));
      setSelectedProducts(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === paginatedProducts.length);
  };

  const handleBulkDelete = async () => {
    if (!hasRole('manager')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete products.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedProducts.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select products to delete.",
        variant: "destructive",
      });
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ${selectedProducts.size} selected product(s)?`
    );

    if (confirmation) {
      try {
        let successCount = 0;
        for (const productId of selectedProducts) {
          const success = await productService.deleteProduct(productId);
          if (success) successCount++;
        }
        
        setSelectedProducts(new Set());
        setSelectAll(false);
        
        toast({
          title: "Bulk Delete Complete",
          description: `Successfully deleted ${successCount} out of ${selectedProducts.size} products.`,
        });
        
        loadProducts();
      } catch (error) {
        toast({
          title: "Bulk Delete Failed",
          description: "Some products could not be deleted. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBulkEdit = () => {
    if (selectedProducts.size !== 1) {
      toast({
        title: "Invalid Selection",
        description: "Please select exactly one product to edit.",
        variant: "destructive",
      });
      return;
    }
    
    const productId = Array.from(selectedProducts)[0];
    const product = products.find(p => p.id === productId);
    if (product) {
      handleEdit(product);
      setSelectedProducts(new Set());
      setSelectAll(false);
    }
  };

  const canManageProducts = hasRole('manager');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Product Management</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage vape products, flavours, and inventory</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {canManageProducts && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-theme-primary" />
              <span className="text-2xl font-bold text-theme-primary">{products.length}</span>
              <span className="text-gray-600 dark:text-gray-400">Total Products</span>
            </div>
          </div>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Filter className="w-5 h-5" />
              <span>Filter Products</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by product name, flavour, or nicotine strength..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Disposable">Disposable</SelectItem>
                  <SelectItem value="Closed Pod">Closed Pod</SelectItem>
                  <SelectItem value="Open System">Open System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Disposable">Disposable</SelectItem>
                  <SelectItem value="Refillable">Refillable</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Label htmlFor="min-price" className="text-sm font-medium whitespace-nowrap">Price:</Label>
                <Input
                  id="min-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Min"
                  value={priceRangeFilter.min}
                  onChange={(e) => setPriceRangeFilter(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20"
                />
                <span className="text-gray-500">-</span>
                <Input
                  id="max-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Max"
                  value={priceRangeFilter.max}
                  onChange={(e) => setPriceRangeFilter(prev => ({ ...prev, max: e.target.value }))}
                  className="w-20"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPriceRangeFilter({ min: '', max: '' })}
                  className="text-xs px-2"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Products ({filteredProducts.length})</CardTitle>
            {selectedProducts.size > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProducts.size} product(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEdit}
                  disabled={selectedProducts.size !== 1}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProducts(new Set());
                    setSelectAll(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Products Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by adding your first product to the system.
                </p>
                {canManageProducts && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Product
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        {canManageProducts && (
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                        )}
                        <TableHead className="dark:text-gray-300">Product Name</TableHead>
                        <TableHead className="dark:text-gray-300">Type</TableHead>
                        <TableHead className="dark:text-gray-300">Category</TableHead>
                        <TableHead className="dark:text-gray-300">Flavour</TableHead>
                        <TableHead className="dark:text-gray-300">Nicotine Strength</TableHead>
                        <TableHead className="dark:text-gray-300">Price</TableHead>
                        <TableHead className="dark:text-gray-300">Added</TableHead>
                        {canManageProducts && <TableHead className="dark:text-gray-300">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                          {canManageProducts && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={() => handleSelectProduct(product.id)}
                                className="rounded border-gray-300"
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium dark:text-gray-100">{product.product_name}</TableCell>
                          <TableCell>
                            <Badge className={getProductTypeColor(product.product_type)}>
                              {product.product_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(product.category)}>
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-theme-primary">{product.flavour}</TableCell>
                          <TableCell className="dark:text-gray-300">{product.nicotine_strength || 'N/A'}</TableCell>
                          <TableCell className="font-semibold text-green-600 dark:text-green-400">
                            £{product.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="dark:text-gray-300">{new Date(product.created_at).toLocaleDateString()}</TableCell>
                          {canManageProducts && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEdit(product)}
                                  className="hover:bg-theme-primary hover:text-white"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDelete(product.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {canManageProducts && (
          <>
            <AddProductDialog
              open={showAddDialog}
              onOpenChange={setShowAddDialog}
              onProductAdded={loadProducts}
            />
            <EditProductDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              product={editingProduct}
              onProductUpdated={loadProducts}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Products;
