import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Trash2, Database, FileText, AlertTriangle, FileDown, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { productService } from '../services/productService';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';

interface ImportProgress {
  isImporting: boolean;
  progress: number;
  currentRow: number;
  totalRows: number;
  success: number;
  duplicates: number;
  errors: string[];
  fileName: string;
}

const DataManagement = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ retailers: 0, orders: 0, products: 0 });
  
  // Progress state for each import type
  const [importProgress, setImportProgress] = useState<Record<string, ImportProgress>>({
    retailers: {
      isImporting: false,
      progress: 0,
      currentRow: 0,
      totalRows: 0,
      success: 0,
      duplicates: 0,
      errors: [],
      fileName: ''
    },
    orders: {
      isImporting: false,
      progress: 0,
      currentRow: 0,
      totalRows: 0,
      success: 0,
      duplicates: 0,
      errors: [],
      fileName: ''
    },
    products: {
      isImporting: false,
      progress: 0,
      currentRow: 0,
      totalRows: 0,
      success: 0,
      duplicates: 0,
      errors: [],
      fileName: ''
    }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [retailers, orders, products] = await Promise.all([
        dataService.getRetailers(),
        dataService.getOrders(),
        productService.getProducts()
      ]);
      
      setStats({
        retailers: retailers.length,
        orders: orders.length,
        products: products.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleExport = async (type: 'retailers' | 'orders' | 'products') => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to export data.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const csvContent = await dataService.exportToCSV(type);
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${type} data has been exported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'retailers' | 'orders' | 'products') => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to import data.",
        variant: "destructive",
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    // Initialize progress state
    setImportProgress(prev => ({
      ...prev,
      [type]: {
        isImporting: true,
        progress: 0,
        currentRow: 0,
        totalRows: 0,
        success: 0,
        duplicates: 0,
        errors: [],
        fileName: file.name
      }
    }));

    try {
      // Read file to get total rows for progress calculation
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const totalRows = Math.max(0, lines.length - 1); // Subtract header row
      
      setImportProgress(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          totalRows
        }
      }));

      // Create progress callback
      const onProgress = (currentRow: number, success: number, duplicates: number, errors: string[]) => {
        const progress = totalRows > 0 ? Math.round((currentRow / totalRows) * 100) : 0;
        setImportProgress(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            progress,
            currentRow,
            success,
            duplicates,
            errors
          }
        }));
      };

      const result = await dataService.importFromCSV(file, type, onProgress);
      
      // Final progress update
      setImportProgress(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          isImporting: false,
          progress: 100,
          success: result.success,
          duplicates: result.duplicates,
          errors: result.errors
        }
      }));

      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.success} ${type}. ${result.duplicates} duplicates skipped.`,
      });

      // Refresh stats
      loadStats();
    } catch (error) {
      setImportProgress(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          isImporting: false
        }
      }));

      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check your CSV format and try again.",
        variant: "destructive",
      });
    }
  };

  const resetProgress = (type: 'retailers' | 'orders' | 'products') => {
    setImportProgress(prev => ({
      ...prev,
      [type]: {
        isImporting: false,
        progress: 0,
        currentRow: 0,
        totalRows: 0,
        success: 0,
        duplicates: 0,
        errors: [],
        fileName: ''
      }
    }));
  };

  const handleDeleteAllData = async () => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete data.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete ALL data? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await dataService.deleteAllData();
      
      toast({
        title: "Data Deleted",
        description: "All data has been permanently deleted.",
      });

      // Refresh stats
      loadStats();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete products.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete ALL products? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await productService.deleteAllProducts();
      
      toast({
        title: "Products Deleted",
        description: "All products have been permanently deleted.",
      });

      // Refresh stats
      loadStats();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllRetailers = async () => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete retailers.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete ALL retailers and their orders? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await dataService.deleteAllRetailers();
      
      toast({
        title: "Retailers Deleted",
        description: "All retailers and their orders have been permanently deleted.",
      });

      // Refresh stats
      loadStats();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete retailers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllOrders = async () => {
    if (!hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete orders.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete ALL orders? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await dataService.deleteAllOrders();
      
      toast({
        title: "Orders Deleted",
        description: "All orders have been permanently deleted.",
      });

      // Refresh stats
      loadStats();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTemplate = (type: 'retailers' | 'orders' | 'products') => {
    const templates = {
      retailers: {
        headers: ['name', 'email', 'phone', 'address', 'city', 'state', 'postal_code', 'country', 'salesperson_name', 'status'],
        sampleData: [
          ['John Doe Store', 'john@store.com', '+1234567890', '123 Main St', 'New York', 'NY', '10001', 'USA', 'Jane Smith', 'active'],
          ['Jane Retail Shop', 'jane@retail.com', '+1234567891', '456 Oak Ave', 'Los Angeles', 'CA', '90210', 'USA', 'Mike Johnson', 'active']
        ]
      },
      orders: {
        headers: ['retailer_email', 'product_name', 'flavour', 'quantity', 'order_date', 'status', 'notes'],
        sampleData: [
          ['john@store.com', 'Product A', 'Vanilla', '10', '2024-01-15', 'completed', 'Regular delivery'],
          ['jane@retail.com', 'Product B', 'Chocolate', '5', '2024-01-16', 'pending', 'Express delivery']
        ]
      },
      products: {
        headers: ['name', 'flavour', 'category', 'product_type', 'price', 'description', 'status'],
        sampleData: [
          ['Product A', 'Vanilla', 'Category 1', 'Type A', '9.99', 'Delicious vanilla product', 'active'],
          ['Product B', 'Chocolate', 'Category 2', 'Type B', '12.99', 'Rich chocolate product', 'active']
        ]
      }
    };

    const template = templates[type];
    const csvContent = [
      template.headers.join(','),
      ...template.sampleData.map(row => 
        row.map(value => {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Template Downloaded",
      description: `${type} template has been downloaded successfully.`,
    });
  };

  if (!hasRole('manager')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <Navigation />
        
        <main className="p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <Database className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              You don't have permission to access data management features.
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
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Data Management</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Import, export, and manage system data</p>
        </div>

        {/* Current Data Overview */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Database className="w-5 h-5" />
              <span>Current Data Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-4 border rounded-lg bg-white dark:bg-gray-800">
                <div className="text-2xl sm:text-3xl font-bold text-theme-primary">{stats.retailers}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Retailers</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-white dark:bg-gray-800">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.orders}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Orders</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-white dark:bg-gray-800 sm:col-span-2 lg:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.products}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Products</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="templates" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
            <TabsTrigger value="export" className="text-xs sm:text-sm">Export Data</TabsTrigger>
            <TabsTrigger value="import" className="text-xs sm:text-sm">Import Data</TabsTrigger>
            <TabsTrigger value="danger" className="text-xs sm:text-sm">Danger Zone</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <FileDown className="w-5 h-5" />
                  <span>CSV Templates</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download CSV templates with proper headers and sample data</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <h3 className="font-medium text-base">Retailers Template</h3>
                    <Button 
                      onClick={() => generateTemplate('retailers')}
                      className="w-full"
                      variant="outline"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Includes all retailer fields with sample data
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium text-base">Orders Template</h3>
                    <Button 
                      onClick={() => generateTemplate('orders')}
                      className="w-full"
                      variant="outline"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Includes all order fields with sample data
                    </p>
                  </div>
                  
                  <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                    <h3 className="font-medium text-base">Products Template</h3>
                    <Button 
                      onClick={() => generateTemplate('products')}
                      className="w-full"
                      variant="outline"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Includes all product fields with sample data
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 text-base">Template Usage Instructions</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Download the appropriate template for your data type</li>
                        <li>• Fill in your data following the sample format</li>
                        <li>• Keep the header row intact</li>
                        <li>• Use UTF-8 encoding for special characters</li>
                        <li>• Date format: YYYY-MM-DD</li>
                        <li>• Required fields must not be empty</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Data Tab */}
          <TabsContent value="export">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Download className="w-5 h-5" />
                  <span>Export Data</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download your data in CSV format</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <h3 className="font-medium text-base">Retailers Data</h3>
                    <Button 
                      onClick={() => handleExport('retailers')}
                      disabled={isLoading || stats.retailers === 0}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Retailers CSV
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.retailers} retailers available
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium text-base">Orders Data</h3>
                    <Button 
                      onClick={() => handleExport('orders')}
                      disabled={isLoading || stats.orders === 0}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Orders CSV
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.orders} orders available
                    </p>
                  </div>
                  
                  <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                    <h3 className="font-medium text-base">Products Data</h3>
                    <Button 
                      onClick={() => handleExport('products')}
                      disabled={isLoading || stats.products === 0}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Products CSV
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.products} products available
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Data Tab */}
          <TabsContent value="import">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Upload className="w-5 h-5" />
                  <span>Import Data</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload CSV files to import data</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="retailers-import" className="text-sm font-medium">Import Retailers</Label>
                    <Input
                      id="retailers-import"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleImport(e, 'retailers')}
                      disabled={importProgress.retailers.isImporting}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CSV file with retailer data
                    </p>
                    
                    {/* Retailers Progress */}
                    {importProgress.retailers.isImporting && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Importing {importProgress.retailers.fileName}
                          </span>
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {importProgress.retailers.progress}%
                          </span>
                        </div>
                        <Progress value={importProgress.retailers.progress} className="mb-2" />
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <div>Row {importProgress.retailers.currentRow} of {importProgress.retailers.totalRows}</div>
                          <div>Success: {importProgress.retailers.success} | Duplicates: {importProgress.retailers.duplicates}</div>
                          {importProgress.retailers.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">Errors: {importProgress.retailers.errors.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Retailers Results */}
                    {!importProgress.retailers.isImporting && importProgress.retailers.progress > 0 && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Import Complete
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetProgress('retailers')}
                            className="h-6 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                          <div>Success: {importProgress.retailers.success} records</div>
                          <div>Duplicates: {importProgress.retailers.duplicates} skipped</div>
                          {importProgress.retailers.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">Errors: {importProgress.retailers.errors.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="orders-import" className="text-sm font-medium">Import Orders</Label>
                    <Input
                      id="orders-import"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleImport(e, 'orders')}
                      disabled={importProgress.orders.isImporting}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CSV file with order data
                    </p>
                    
                    {/* Orders Progress */}
                    {importProgress.orders.isImporting && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Importing {importProgress.orders.fileName}
                          </span>
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {importProgress.orders.progress}%
                          </span>
                        </div>
                        <Progress value={importProgress.orders.progress} className="mb-2" />
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <div>Row {importProgress.orders.currentRow} of {importProgress.orders.totalRows}</div>
                          <div>Success: {importProgress.orders.success} | Duplicates: {importProgress.orders.duplicates}</div>
                          {importProgress.orders.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">Errors: {importProgress.orders.errors.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Orders Results */}
                    {!importProgress.orders.isImporting && importProgress.orders.progress > 0 && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Import Complete
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetProgress('orders')}
                            className="h-6 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                          <div>Success: {importProgress.orders.success} records</div>
                          <div>Duplicates: {importProgress.orders.duplicates} skipped</div>
                          {importProgress.orders.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">Errors: {importProgress.orders.errors.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="products-import" className="text-sm font-medium">Import Products</Label>
                    <Input
                      id="products-import"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleImport(e, 'products')}
                      disabled={importProgress.products.isImporting}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CSV file with product data
                    </p>
                    
                    {/* Products Progress */}
                    {importProgress.products.isImporting && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Importing {importProgress.products.fileName}
                          </span>
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {importProgress.products.progress}%
                          </span>
                        </div>
                        <Progress value={importProgress.products.progress} className="mb-2" />
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <div>Row {importProgress.products.currentRow} of {importProgress.products.totalRows}</div>
                          <div>Success: {importProgress.products.success} | Duplicates: {importProgress.products.duplicates}</div>
                          {importProgress.products.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">Errors: {importProgress.products.errors.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Products Results */}
                    {!importProgress.products.isImporting && importProgress.products.progress > 0 && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Import Complete
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetProgress('products')}
                            className="h-6 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                          <div>Success: {importProgress.products.success} records</div>
                          <div>Duplicates: {importProgress.products.duplicates} skipped</div>
                          {importProgress.products.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">Errors: {importProgress.products.errors.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 text-base">CSV Format Requirements</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• First row should contain column headers</li>
                        <li>• Use UTF-8 encoding for special characters</li>
                        <li>• Date format: YYYY-MM-DD</li>
                        <li>• Required fields must not be empty</li>
                        <li>• <strong>Products:</strong> Category and Product Type must exist in the system</li>
                        <li>• <strong>Products:</strong> Product Name + Flavour combination must be unique</li>
                        <li>• <strong>Retailers:</strong> Salesperson Name must exist in the system</li>
                        <li>• <strong>Retailers:</strong> Email addresses must be unique</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            {hasRole('admin') && (
              <Card className="border-red-200 dark:border-red-800 shadow-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-lg sm:text-xl">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Danger Zone</span>
                  </CardTitle>
                  <p className="text-sm text-red-600 dark:text-red-400">Irreversible actions that permanently affect your data</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 sm:space-y-6">
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base">Delete All Data</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This will permanently delete all retailers, orders, and associated data. 
                        This action cannot be undone.
                      </p>
                      <Button 
                        onClick={handleDeleteAllData}
                        disabled={isLoading}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Data
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base">Delete All Products</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This will permanently delete all products. 
                        This action cannot be undone.
                      </p>
                      <Button 
                        onClick={handleDeleteAllProducts}
                        disabled={isLoading}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Products
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base">Delete All Retailers</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This will permanently delete all retailers and their orders. 
                        This action cannot be undone.
                      </p>
                      <Button 
                        onClick={handleDeleteAllRetailers}
                        disabled={isLoading}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Retailers
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base">Delete All Orders</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This will permanently delete all orders. 
                        This action cannot be undone.
                      </p>
                      <Button 
                        onClick={handleDeleteAllOrders}
                        disabled={isLoading}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Orders
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DataManagement;
