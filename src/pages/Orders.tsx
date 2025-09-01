import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye, Filter, Plus, Edit, Trash2 } from 'lucide-react';
import { supabaseDataService } from '../services/supabaseDataService';
import { useAuth } from '../contexts/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import AddOrderDialog from '../components/AddOrderDialog';
import OrderViewDialog from '../components/OrderViewDialog';
import EditOrderDialog from '../components/EditOrderDialog';

interface Order {
  id: string;
  retailer_id: string;
  retailer_name: string;
  order_date: string;
  order_number: string;
  total_amount: number;
  tax_amount: number;
  quantity: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  shipping_address: string;
  salesperson: string;
}

const Orders = () => {
  const { hasRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [totalRangeFilter, setTotalRangeFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showViewOrder, setShowViewOrder] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadOrders();
    
    const handleDataChange = (event: any) => {
      if (event.detail?.type === 'orders' || !event.detail) {
        loadOrders();
      }
    };
    
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, []);

  const loadOrders = async () => {
    try {
      const ordersData = await supabaseDataService.getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.retailer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.salesperson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesDate = !dateFilter || order.order_date.startsWith(dateFilter);
    
    const matchesTotalRange = 
      (!totalRangeFilter.min || order.total_amount >= parseFloat(totalRangeFilter.min)) &&
      (!totalRangeFilter.max || order.total_amount <= parseFloat(totalRangeFilter.max));
    
    return matchesSearch && matchesStatus && matchesDate && matchesTotalRange;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowViewOrder(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditOrder(true);
  };

  const handleDeleteOrder = async (order: Order) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete order ${order.order_number}?`
    );

    if (confirmation) {
      try {
        const success = await supabaseDataService.deleteOrder(order.id);
        if (success) {
          loadOrders();
        } else {
          alert('Failed to delete order. Please try again.');
        }
      } catch (error) {
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(paginatedOrders.map(order => order.id));
      setSelectedOrders(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
    setSelectAll(newSelected.size === paginatedOrders.length);
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) {
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ${selectedOrders.size} selected order(s)?`
    );

    if (confirmation) {
      try {
        let successCount = 0;
        for (const orderId of selectedOrders) {
          const success = await supabaseDataService.deleteOrder(orderId);
          if (success) successCount++;
        }
        
        setSelectedOrders(new Set());
        setSelectAll(false);
        
        // Show success message
        alert(`Successfully deleted ${successCount} out of ${selectedOrders.size} orders.`);
        
        loadOrders();
      } catch (error) {
        alert('Some orders could not be deleted. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 lg:pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage and track all retailer orders</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button onClick={() => setShowAddOrder(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </Button>
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-theme-primary" />
              <span className="text-2xl font-bold text-theme-primary">{orders.length}</span>
              <span className="text-gray-600">Total Orders</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Orders</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search by order number, retailer, or salesperson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="max-w-xs"
                  placeholder="Filter by date"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalRangeFilter.min}
                  onChange={(e) => setTotalRangeFilter({ ...totalRangeFilter, min: e.target.value })}
                  className="max-w-xs"
                  placeholder="Min total"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalRangeFilter.max}
                  onChange={(e) => setTotalRangeFilter({ ...totalRangeFilter, max: e.target.value })}
                  className="max-w-xs"
                  placeholder="Max total"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('');
                    setTotalRangeFilter({ min: '', max: '' });
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            {selectedOrders.size > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600">
                  {selectedOrders.size} order(s) selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOrders(new Set());
                    setSelectAll(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-2 px-4 font-medium">Order #</th>
                    <th className="text-left py-2 px-4 font-medium">Retailer</th>
                    <th className="text-left py-2 px-4 font-medium">Date</th>
                    <th className="text-left py-2 px-4 font-medium">Quantity</th>
                    <th className="text-left py-2 px-4 font-medium">Total</th>
                    <th className="text-left py-2 px-4 font-medium">Status</th>
                    <th className="text-left py-2 px-4 font-medium">Payment</th>
                    <th className="text-left py-2 px-4 font-medium">Salesperson</th>
                    <th className="text-left py-2 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">{order.order_number}</td>
                      <td className="py-3 px-4">
                        <Link to={`/retailer/${order.retailer_id}`} className="hover:text-theme-primary">
                          {order.retailer_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{new Date(order.order_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{order.quantity}</td>
                      <td className="py-3 px-4 font-semibold">${order.total_amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/salesperson/${encodeURIComponent(order.salesperson)}`} className="text-theme-primary hover:underline">
                          {order.salesperson}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            className="hover:bg-theme-primary hover:text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {hasRole('admin') && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditOrder(order)}
                                className="hover:bg-blue-500 hover:text-white"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteOrder(order)}
                                className="hover:bg-red-500 hover:text-white"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <AddOrderDialog
          open={showAddOrder}
          onOpenChange={setShowAddOrder}
          onOrderAdded={loadOrders}
        />

        <OrderViewDialog
          open={showViewOrder}
          onOpenChange={setShowViewOrder}
          order={selectedOrder}
        />

        <EditOrderDialog
          open={showEditOrder}
          onOpenChange={setShowEditOrder}
          order={selectedOrder}
          onOrderUpdated={loadOrders}
        />
      </main>
    </div>
  );
};

export default Orders;
