import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Eye } from 'lucide-react';
import { dataService } from '../services/dataService';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import { useToast } from '@/hooks/use-toast';

const SalespersonList = () => {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [salespersonData, setSalespersonData] = useState<any[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [retailersData, salespersonsData, ordersData] = await Promise.all([
        dataService.getRetailers(),
        dataService.getSalespersons(),
        dataService.getOrders()
      ]);
      setRetailers(retailersData);
      
      // Create salesperson data with stored revenue and retailer counts
      const salespersonMap: { [key: string]: any } = {};
      
      // Initialize with salesperson data from database
      salespersonsData.forEach(salesperson => {
        salespersonMap[salesperson.name] = {
          name: salesperson.name,
          retailerCount: 0,
          totalRevenue: salesperson.total_revenue || 0, // Use stored revenue
          calculatedRevenue: 0, // Will be calculated from orders
          approvedCount: 0,
          pendingCount: 0,
          rejectedCount: 0
        };
      });
      
      // Count retailers and status for each salesperson
      retailersData.forEach(retailer => {
        const salesperson = retailer.salesperson || 'Not assigned';
        if (!salespersonMap[salesperson]) {
          salespersonMap[salesperson] = {
            name: salesperson,
            retailerCount: 0,
            totalRevenue: 0, // No stored revenue for unassigned
            calculatedRevenue: 0,
            approvedCount: 0,
            pendingCount: 0,
            rejectedCount: 0
          };
        }
        
        salespersonMap[salesperson].retailerCount++;
        
        if (retailer.status === 'Approved') salespersonMap[salesperson].approvedCount++;
        else if (retailer.status === 'Pending') salespersonMap[salesperson].pendingCount++;
        else if (retailer.status === 'Rejected') salespersonMap[salesperson].rejectedCount++;
      });
      
      // Calculate revenue from orders for each salesperson
      ordersData.forEach(order => {
        const salesperson = order.salesperson || 'Not assigned';
        if (salespersonMap[salesperson]) {
          salespersonMap[salesperson].calculatedRevenue += order.total_amount || 0;
        }
      });
      
      // Use calculated revenue if stored revenue is 0 or significantly different
      Object.values(salespersonMap).forEach((salesperson: any) => {
        if (salesperson.totalRevenue === 0 && salesperson.calculatedRevenue > 0) {
          salesperson.totalRevenue = salesperson.calculatedRevenue;
        }
      });
      
      const sortedData = Object.values(salespersonMap).sort((a: any, b: any) => 
        b.totalRevenue - a.totalRevenue
      );
      
      setSalespersonData(sortedData);
    } catch (error) {
      console.error('Failed to load salesperson data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);







  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Sales Team</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Performance overview and retailer assignments</p>
          </div>
                      <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-theme-primary" />
                <span className="text-xl sm:text-2xl font-bold text-theme-primary">{salespersonData.length}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Sales Staff</span>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {salespersonData.map((salesperson, index) => (
            <Card key={salesperson.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{salesperson.name}</span>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-theme-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-theme-primary">
                      ${salesperson.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Revenue
                      {salesperson.calculatedRevenue > 0 && salesperson.totalRevenue === salesperson.calculatedRevenue && (
                        <span className="ml-1 text-xs text-orange-600">(calculated)</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold">{salesperson.retailerCount}</div>
                      <div className="text-xs text-gray-600">Total Retailers</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{salesperson.approvedCount}</div>
                      <div className="text-xs text-gray-600">Approved</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-semibold text-yellow-600">{salesperson.pendingCount}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-semibold text-red-600">{salesperson.rejectedCount}</div>
                      <div className="text-xs text-gray-600">Rejected</div>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/salesperson/${encodeURIComponent(salesperson.name)}`}
                    className="w-full bg-theme-primary text-white py-2 px-4 rounded-md hover:bg-theme-primary/90 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {salespersonData.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h3>
              <p className="text-gray-600">No salesperson data available yet.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SalespersonList;
