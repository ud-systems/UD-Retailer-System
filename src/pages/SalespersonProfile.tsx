import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Building, DollarSign, TrendingUp } from 'lucide-react';
import { dataService } from '../services/dataService';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import { useToast } from '@/hooks/use-toast';

const SalespersonProfile = () => {
  const { name } = useParams();
  const [retailers, setRetailers] = useState<any[]>([]);
  const [salespersonRetailers, setSalespersonRetailers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRetailers: 0,
    totalRevenue: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    averageRevenue: 0
  });
  const [isUsingCalculatedRevenue, setIsUsingCalculatedRevenue] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    if (!name) return;
    
    try {
      const [retailersData, salespersonsData, ordersData] = await Promise.all([
        dataService.getRetailers(),
        dataService.getSalespersons(),
        dataService.getOrders()
      ]);
      setRetailers(retailersData);
      
      const decodedName = decodeURIComponent(name);
      const filteredRetailers = retailersData.filter(
        retailer => retailer.salesperson === decodedName
      );
      
      setSalespersonRetailers(filteredRetailers);
      
      // Find the salesperson in the database to get stored revenue
      const salesperson = salespersonsData.find(sp => sp.name === decodedName);
      const storedRevenue = salesperson?.total_revenue || 0;
      
      // Calculate revenue from orders for this salesperson
      const calculatedRevenue = ordersData
        .filter(order => order.salesperson === decodedName)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      // Use calculated revenue if stored revenue is 0 or significantly different
      const totalRevenue = storedRevenue === 0 && calculatedRevenue > 0 ? calculatedRevenue : storedRevenue;
      
      // Store whether we're using calculated revenue for display
      const isUsingCalculatedRevenue = storedRevenue === 0 && calculatedRevenue > 0;
      
      // Calculate stats
      const totalRetailers = filteredRetailers.length;
      const approvedCount = filteredRetailers.filter(r => r.status === 'Approved').length;
      const pendingCount = filteredRetailers.filter(r => r.status === 'Pending').length;
      const rejectedCount = filteredRetailers.filter(r => r.status === 'Rejected').length;
      const averageRevenue = totalRetailers > 0 ? totalRevenue / totalRetailers : 0;
      
      setStats({
        totalRetailers,
        totalRevenue,
        approvedCount,
        pendingCount,
        rejectedCount,
        averageRevenue
      });
      
      setIsUsingCalculatedRevenue(isUsingCalculatedRevenue);
    } catch (error) {
      console.error('Failed to load salesperson data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [name]);

  const decodedName = name ? decodeURIComponent(name) : '';



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{decodedName}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Salesperson Profile</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Building className="w-8 h-8 text-theme-primary" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRetailers}</p>
                  <p className="text-gray-600">Total Retailers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-gray-600">
                    Total Revenue
                    {isUsingCalculatedRevenue && (
                      <span className="ml-1 text-xs text-orange-600">(calculated)</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">${stats.averageRevenue.toLocaleString()}</p>
                  <p className="text-gray-600">Avg Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedCount}</p>
                  <p className="text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Retailer Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.approvedCount}</div>
                <div className="text-gray-600">Approved</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
                <div className="text-gray-600">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retailers List */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Retailers ({salespersonRetailers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {salespersonRetailers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Company</th>
                      <th className="text-left py-2 px-4 font-medium">Status</th>
                      <th className="text-left py-2 px-4 font-medium">City</th>
                      <th className="text-left py-2 px-4 font-medium">Revenue</th>
                      <th className="text-left py-2 px-4 font-medium">Orders</th>
                      <th className="text-left py-2 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salespersonRetailers.map((retailer) => (
                      <tr key={retailer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{retailer.reg_company_name}</div>
                            <div className="text-sm text-gray-500">{retailer.store_name}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(retailer.status)}>
                            {retailer.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{retailer.retailer_city}</td>
                        <td className="py-3 px-4 font-semibold">${retailer.total_spent.toLocaleString()}</td>
                        <td className="py-3 px-4">{retailer.total_order_count}</td>
                        <td className="py-3 px-4">
                          <Link to={`/retailer/${retailer.id}`}>
                            <Button variant="outline" size="sm" className="hover:bg-theme-primary hover:text-white">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No retailers assigned to this salesperson</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalespersonProfile;
