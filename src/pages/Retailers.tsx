import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Building, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '../services/dataService';
import { productService } from '../services/productService';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import AddRetailerDialog from '../components/AddRetailerDialog';
import EditRetailerDialog from '../components/EditRetailerDialog';

interface Retailer {
  id: string;
  date_created: string;
  reg_company_name: string;
  store_name: string;
  contact_person: string;
  sector: 'Vape Shop' | 'Convenience Store' | 'Not Provided';
  email: string;
  phone_number: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  address_1: string;
  address_2: string;
  retailer_city: string;
  retailer_postcode: string;
  country: string;
  registration_channel: 'Website' | 'POS' | 'Manual';
  email_marketing: 'Subscribed' | 'Unsubscribed';
  total_order_count: number;
  total_tax: number;
  total_spent: number;
  salesperson: string;
  assigned_products: string[];
}

const Retailers = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null);
  const [productNames, setProductNames] = useState<{ [key: string]: string }>({});
  const [productFlavours, setProductFlavours] = useState<{ [key: string]: string }>({});
  const [productTypes, setProductTypes] = useState<{ [key: string]: string }>({});
  const [selectedRetailers, setSelectedRetailers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
    
    const handleDataChange = (event: any) => {
      if (!event.detail || event.detail.type === 'retailers') {
        loadData();
      }
    };
    
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, []);

  const loadData = async () => {
    try {
      const [retailersData, productsData] = await Promise.all([
        dataService.getRetailers(),
        productService.getProducts()
      ]);
      
      // Ensure assigned_products is always an array
      const normalizedRetailers = retailersData.map(retailer => ({
        ...retailer,
        assigned_products: retailer.assigned_products || []
      }));
      
      setRetailers(normalizedRetailers);
      
      // Create product lookup maps
      const names: { [key: string]: string } = {};
      const flavours: { [key: string]: string } = {};
      const types: { [key: string]: string } = {};
      
      productsData.forEach(product => {
        names[product.id] = product.product_name;
        flavours[product.id] = product.flavour;
        types[product.id] = product.product_type;
      });
      
      setProductNames(names);
      setProductFlavours(flavours);
      setProductTypes(types);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getAssignedProductsForRetailer = (retailer: Retailer) => {
    if (!retailer.assigned_products || retailer.assigned_products.length === 0) {
      return [];
    }
    
    const availableProducts = retailer.assigned_products.filter(productId => 
      productNames[productId] // Only include products that exist
    );
    
    return availableProducts;
  };

  const filteredRetailers = retailers.filter(retailer => {
    const matchesSearch = 
      retailer.reg_company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retailer.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retailer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retailer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || retailer.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || retailer.sector === sectorFilter;
    const matchesCity = cityFilter === 'all' || retailer.retailer_city === cityFilter;
    const matchesSalesperson = salespersonFilter === 'all' || retailer.salesperson === salespersonFilter;
    
    return matchesSearch && matchesStatus && matchesSector && matchesCity && matchesSalesperson;
  });

  const totalPages = Math.ceil(filteredRetailers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRetailers = filteredRetailers.slice(startIndex, startIndex + itemsPerPage);
  const uniqueCities = [...new Set(retailers.map(r => r.retailer_city))].sort();
  const uniqueSalespersons = [...new Set(retailers.map(r => r.salesperson))].sort();

  const getStatusColor = (status: Retailer['status']) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getSectorColor = (sector: Retailer['sector']) => {
    switch (sector) {
      case 'Vape Shop':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Convenience Store':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Not Provided':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleEdit = (retailer: Retailer) => {
    if (!hasRole('manager') && !hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit retailers.",
        variant: "destructive",
      });
      return;
    }
    setEditingRetailer(retailer);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete retailers.",
        variant: "destructive",
      });
      return;
    }
    if (window.confirm('Are you sure you want to delete this retailer?')) {
      const success = await dataService.deleteRetailer(id);
      if (success) {
        toast({
          title: "Retailer Deleted",
          description: "Retailer has been successfully deleted.",
        });
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRetailers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(paginatedRetailers.map(retailer => retailer.id));
      setSelectedRetailers(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectRetailer = (retailerId: string) => {
    const newSelected = new Set(selectedRetailers);
    if (newSelected.has(retailerId)) {
      newSelected.delete(retailerId);
    } else {
      newSelected.add(retailerId);
    }
    setSelectedRetailers(newSelected);
    setSelectAll(newSelected.size === paginatedRetailers.length);
  };

  const handleBulkDelete = async () => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete retailers.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedRetailers.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select retailers to delete.",
        variant: "destructive",
      });
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ${selectedRetailers.size} selected retailer(s)?`
    );

    if (confirmation) {
      try {
        let successCount = 0;
        for (const retailerId of selectedRetailers) {
          const success = await dataService.deleteRetailer(retailerId);
          if (success) successCount++;
        }
        
        setSelectedRetailers(new Set());
        setSelectAll(false);
        
        toast({
          title: "Bulk Delete Complete",
          description: `Successfully deleted ${successCount} out of ${selectedRetailers.size} retailers.`,
        });
        
        loadData();
      } catch (error) {
        toast({
          title: "Bulk Delete Failed",
          description: "Some retailers could not be deleted. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBulkEdit = () => {
    if (selectedRetailers.size !== 1) {
      toast({
        title: "Invalid Selection",
        description: "Please select exactly one retailer to edit.",
        variant: "destructive",
      });
      return;
    }
    
    const retailerId = Array.from(selectedRetailers)[0];
    const retailer = retailers.find(r => r.id === retailerId);
    if (retailer) {
      handleEdit(retailer);
      setSelectedRetailers(new Set());
      setSelectAll(false);
    }
  };

  const canManageRetailers = hasRole('manager') || hasRole('admin');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Retailer Management</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage retailer accounts, approvals, and information</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {canManageRetailers && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Retailer
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <Building className="w-8 h-8 text-theme-primary" />
              <span className="text-2xl font-bold text-theme-primary">{retailers.length}</span>
              <span className="text-gray-600 dark:text-gray-400">Total Retailers</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Filter className="w-5 h-5" />
              <span>Filter Retailers</span>
            </CardTitle>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by company, store, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="Vape Shop">Vape Shop</SelectItem>
                  <SelectItem value="Convenience Store">Convenience Store</SelectItem>
                  <SelectItem value="Not Provided">Not Provided</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salespersons</SelectItem>
                  {uniqueSalespersons.map((salesperson) => (
                    <SelectItem key={salesperson} value={salesperson}>
                      {salesperson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Retailers Table */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Retailers ({filteredRetailers.length})</CardTitle>
            {selectedRetailers.size > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRetailers.size} retailer(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEdit}
                  disabled={selectedRetailers.size !== 1}
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
                    setSelectedRetailers(new Set());
                    setSelectAll(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {retailers.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Retailers Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by adding your first retailer to the system.
                </p>
                {canManageRetailers && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Retailer
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        {canManageRetailers && (
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                        )}
                        <TableHead className="dark:text-gray-300">Company</TableHead>
                        <TableHead className="dark:text-gray-300">Contact</TableHead>
                        <TableHead className="dark:text-gray-300">Status</TableHead>
                        <TableHead className="dark:text-gray-300">Sector</TableHead>
                        <TableHead className="dark:text-gray-300">City</TableHead>
                        <TableHead className="dark:text-gray-300">Salesperson</TableHead>
                        <TableHead className="dark:text-gray-300">Products</TableHead>
                        <TableHead className="dark:text-gray-300">Revenue</TableHead>
                        <TableHead className="dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRetailers.map((retailer) => {
                        const assignedProducts = getAssignedProductsForRetailer(retailer);
                        return (
                          <TableRow key={retailer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                            {canManageRetailers && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedRetailers.has(retailer.id)}
                                  onChange={() => handleSelectRetailer(retailer.id)}
                                  className="rounded border-gray-300"
                                />
                              </TableCell>
                            )}
                            <TableCell className="dark:text-gray-100">
                              <div className="space-y-1">
                                <div className="font-medium">{retailer.reg_company_name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{retailer.store_name}</div>
                              </div>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">
                              <div className="space-y-1">
                                <div className="text-sm">{retailer.contact_person}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{retailer.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(retailer.status)}>
                                {retailer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSectorColor(retailer.sector)}>
                                {retailer.sector}
                              </Badge>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">{retailer.retailer_city}</TableCell>
                            <TableCell className="dark:text-gray-300">
                              <Link 
                                to={`/salesperson/${encodeURIComponent(retailer.salesperson)}`}
                                className="text-theme-primary hover:underline"
                              >
                                {retailer.salesperson}
                              </Link>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">
                              {assignedProducts.length > 0 ? (
                                <div className="space-y-1">
                                  {assignedProducts.slice(0, 3).map((productId) => (
                                    <div key={productId} className="text-xs">
                                      <span className="font-medium">{productNames[productId]}</span>
                                      <span className="text-gray-500"> - {productFlavours[productId]}</span>
                                    </div>
                                  ))}
                                  {assignedProducts.length > 3 && (
                                    <div className="text-xs text-gray-500">
                                      +{assignedProducts.length - 3} more
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No products assigned</span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-theme-primary dark:text-theme-primary">
                              ${retailer.total_spent.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link to={`/retailer/${retailer.id}`}>
                                  <Button variant="outline" size="sm" className="hover:bg-theme-primary hover:text-white">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {canManageRetailers && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEdit(retailer)}
                                      className="hover:bg-theme-primary hover:text-white"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    {hasRole('admin') && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleDelete(retailer.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

        {canManageRetailers && (
          <>
            <AddRetailerDialog
              open={showAddDialog}
              onOpenChange={setShowAddDialog}
              onRetailerAdded={loadData}
            />
            <EditRetailerDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              retailer={editingRetailer}
              onRetailerUpdated={loadData}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Retailers;
