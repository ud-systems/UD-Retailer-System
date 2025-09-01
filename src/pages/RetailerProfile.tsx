import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Building, Mail, Phone, MapPin, Calendar, Package, DollarSign, 
  Edit, Users, TrendingUp, ShoppingCart, CreditCard, Globe, User, Settings,
  CheckCircle, Clock, XCircle, Star, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '../services/dataService';
import { productService } from '../services/productService';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import EditRetailerDialog from '../components/EditRetailerDialog';

interface Retailer {
  id: string;
  reg_company_name: string;
  store_name: string;
  contact_person: string;
  sector: string;
  email: string;
  phone_number: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  address_1: string;
  address_2: string;
  retailer_city: string;
  retailer_postcode: string;
  country: string;
  registration_channel: string;
  email_marketing: string;
  total_order_count: number;
  total_tax: number;
  total_spent: number;
  salesperson: string;
  date_created: string;
  assigned_products?: string[];
}

const RetailerProfile = () => {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadData = async () => {
    if (!id) return;
    
    try {
      const [retailersData, ordersData, productsData] = await Promise.all([
        dataService.getRetailers(),
        dataService.getOrders(),
        productService.getProducts()
      ]);
      
      const foundRetailer = retailersData.find(r => r.id === id);
      setRetailer(foundRetailer || null);
      
      // Filter orders for this retailer
      const retailerOrders = ordersData.filter(order => order.retailer_id === id);
      setOrders(retailerOrders);
      
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load retailer data:', error);
      toast({
        title: "Error",
        description: "Failed to load retailer data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    const handleDataChange = () => {
      loadData();
    };
    
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, [id]);

  const handleEdit = () => {
    if (!hasRole('manager') && !hasRole('admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit retailers.",
        variant: "destructive",
      });
      return;
    }
    setShowEditDialog(true);
  };

  const handleRetailerUpdated = () => {
    loadData();
    toast({
      title: "Success",
      description: "Retailer information updated successfully.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <Navigation />
        <main className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-theme-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading retailer profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!retailer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <Navigation />
        <main className="p-6">
          <div className="text-center py-12">
            <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Retailer Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The retailer you're looking for doesn't exist.</p>
            <Link to="/retailers">
              <Button className="bg-theme-primary text-white hover:bg-theme-primary/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Retailers
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'Vape Shop':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Convenience Store':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const assignedProducts = retailer.assigned_products ? 
    products.filter(product => retailer.assigned_products!.includes(product.id)) : [];

  const recentOrders = orders.slice(0, 5);
  const totalRevenue = retailer.total_spent || 0;
  const avgOrderValue = retailer.total_order_count > 0 ? totalRevenue / retailer.total_order_count : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-6 space-y-6">
        {/* Header with Edit Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{retailer.reg_company_name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Retailer Profile</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(retailer.status)} flex items-center space-x-1`}>
              {getStatusIcon(retailer.status)}
              <span>{retailer.status}</span>
            </Badge>
            {(hasRole('manager') || hasRole('admin')) && (
              <Button onClick={handleEdit} className="bg-theme-primary text-white hover:bg-theme-primary/90">
                <Edit className="w-4 h-4 mr-2" />
                Edit Retailer
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {retailer.total_order_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${avgOrderValue.toFixed(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tax</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${retailer.total_tax.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Information */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <Building className="w-5 h-5" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{retailer.reg_company_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Store Name</label>
                  <p className="text-gray-900 dark:text-gray-100">{retailer.store_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Person</label>
                  <p className="text-gray-900 dark:text-gray-100">{retailer.contact_person}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sector</label>
                  <Badge className={getSectorColor(retailer.sector)}>{retailer.sector}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Channel</label>
                  <p className="text-gray-900 dark:text-gray-100">{retailer.registration_channel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Marketing</label>
                  <Badge variant={retailer.email_marketing === 'Subscribed' ? 'default' : 'secondary'}>
                    {retailer.email_marketing}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <Mail className="w-5 h-5" />
                <span>Contact Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{retailer.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{retailer.phone_number}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {retailer.address_1}
                    {retailer.address_2 && <><br />{retailer.address_2}</>}
                    <br />{retailer.retailer_city}, {retailer.retailer_postcode}
                    <br />{retailer.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Registered</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(retailer.date_created).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Salesperson</p>
                  <Link 
                    to={`/salesperson/${encodeURIComponent(retailer.salesperson)}`}
                    className="font-medium text-theme-primary hover:underline"
                  >
                    {retailer.salesperson}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Products */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <Package className="w-5 h-5" />
                <span>Assigned Products ({assignedProducts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedProducts.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {assignedProducts.map((product) => (
                    <div key={product.id} className="p-3 border rounded-lg dark:border-gray-600">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{product.product_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{product.flavour}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{product.product_type}</div>
                      {product.price && (
                        <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                          ${product.price}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No products assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <Activity className="w-5 h-5" />
                <span>Recent Orders ({orders.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{order.order_number}</div>
                            <Badge variant={order.status === 'Delivered' ? 'default' : order.status === 'Pending' ? 'secondary' : 'outline'}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(order.order_date).toLocaleDateString()} • {order.quantity} items
                          </div>
                          {order.product_name && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              {order.product_name} {order.flavour && `- ${order.flavour}`}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            ${order.total_amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Tax: ${order.tax_amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <div className="text-center pt-4">
                      <Link to="/orders" className="text-theme-primary text-sm hover:underline font-medium">
                        View all {orders.length} orders →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Retailer Dialog */}
        <EditRetailerDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          retailer={retailer}
          onRetailerUpdated={handleRetailerUpdated}
        />
      </main>
    </div>
  );
};

export default RetailerProfile;
