
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, CheckCircle, Clock, XCircle, Users } from 'lucide-react';
import { dataService } from '../services/dataService';

interface Retailer {
  id: string;
  reg_company_name: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  date_created: string;
  retailer_city: string;
  salesperson: string;
  total_spent: number;
  total_order_count: number;
}

const RetailerTable = () => {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadRetailers();
    
    const handleDataChange = () => loadRetailers();
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, []);

  const loadRetailers = async () => {
    try {
      const retailersData = await dataService.getRetailers();
      setRetailers(retailersData);
    } catch (error) {
      console.error('Failed to load retailers:', error);
    }
  };

  const recentRetailers = retailers
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
    .slice(0, 10);

  const handleStatusChange = async (id: string, newStatus: 'Approved' | 'Pending' | 'Rejected') => {
    try {
      await dataService.updateRetailer(id, { status: newStatus });
      const updatedRetailers = await dataService.getRetailers();
      setRetailers(updatedRetailers);
    } catch (error) {
      console.error('Failed to update retailer status:', error);
    }
  };

  const getStatusColor = (status: Retailer['status']) => {
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

  const getStatusIcon = (status: Retailer['status']) => {
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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Recent Retailers</span>
        </CardTitle>
        <p className="text-sm text-gray-600">Latest retailer registrations and their status</p>
      </CardHeader>
      <CardContent>
        {recentRetailers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No retailers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-3 font-medium text-sm">Company</th>
                  <th className="py-2 px-3 font-medium text-sm">Status</th>
                  <th className="py-2 px-3 font-medium text-sm">Date</th>
                  <th className="py-2 px-3 font-medium text-sm">City</th>
                  <th className="py-2 px-3 font-medium text-sm">Salesperson</th>
                  <th className="py-2 px-3 font-medium text-sm">Revenue</th>
                  <th className="py-2 px-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentRetailers.map((retailer) => (
                  <tr key={retailer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="font-medium text-sm">
                        {retailer.reg_company_name.length > 25 
                          ? retailer.reg_company_name.substring(0, 25) + '...' 
                          : retailer.reg_company_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {retailer.total_order_count} orders
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge className={`${getStatusColor(retailer.status)} flex items-center space-x-1 w-fit`}>
                        {getStatusIcon(retailer.status)}
                        <span>{retailer.status}</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-sm">
                      {new Date(retailer.date_created).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-sm">
                      {retailer.retailer_city}
                    </td>
                    <td className="py-3 px-3 text-sm">
                      <Link 
                        to={`/salesperson/${encodeURIComponent(retailer.salesperson)}`}
                        className="text-theme-primary hover:underline"
                      >
                        {retailer.salesperson}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-sm font-medium">
                      ${retailer.total_spent.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex space-x-1">
                        <Link to={`/retailer/${retailer.id}`}>
                          <Button variant="outline" size="sm" className="hover:bg-theme-primary hover:text-white">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </Link>
                        {user && (
                          <div className="flex space-x-1">
                            {retailer.status !== 'Approved' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleStatusChange(retailer.id, 'Approved')}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                              >
                                ✓
                              </Button>
                            )}
                            {retailer.status !== 'Rejected' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleStatusChange(retailer.id, 'Rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
                              >
                                ✗
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link 
            to="/retailers" 
            className="text-theme-primary hover:underline text-sm font-medium"
          >
            View All Retailers →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetailerTable;
