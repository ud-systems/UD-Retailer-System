import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  MapPin, Users, Store, TrendingUp, Package, DollarSign, BarChart3, 
  Filter, Calendar, Target, Award, Activity, Globe, Building2
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { productService } from '../services/productService';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';

interface AnalyticsFilters {
  selectedCity: string;
  selectedSector: string;
  selectedStatus: string;
  selectedChannel: string;
  dateRange: string;
  sortBy: 'revenue' | 'retailers' | 'orders' | 'growth';
  searchTerm: string;
}

interface CityData {
  city: string;
  retailers: number;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  growth: number;
  sectors: { [key: string]: number };
  topRetailers: any[];
}

const CityAnalytics = () => {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    selectedCity: 'all',
    selectedSector: 'all',
    selectedStatus: 'all',
    selectedChannel: 'all',
    dateRange: 'all',
    sortBy: 'revenue',
    searchTerm: ''
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [retailersData, ordersData, productsData] = await Promise.all([
          dataService.getRetailers(),
          dataService.getOrders(),
          productService.getProducts()
        ]);
        setRetailers(retailersData);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    const handleDataChange = () => loadData();
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, []);

  // Process and filter data
  const processedData = useMemo(() => {
    if (!retailers.length) return { cities: [], sectors: [], channels: [], statuses: [], filteredRetailers: [], totalRevenue: 0, totalOrders: 0 };

    // Filter retailers based on current filters
    let filteredRetailers = retailers.filter(retailer => {
      if (filters.selectedCity && filters.selectedCity !== 'all' && retailer.retailer_city !== filters.selectedCity) return false;
      if (filters.selectedSector && filters.selectedSector !== 'all' && retailer.sector !== filters.selectedSector) return false;
      if (filters.selectedStatus && filters.selectedStatus !== 'all' && retailer.status !== filters.selectedStatus) return false;
      if (filters.selectedChannel && filters.selectedChannel !== 'all' && retailer.registration_channel !== filters.selectedChannel) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          retailer.reg_company_name.toLowerCase().includes(searchLower) ||
          retailer.retailer_city.toLowerCase().includes(searchLower) ||
          retailer.salesperson.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Get unique values for filter options
    const cities = [...new Set(retailers.map(r => r.retailer_city).filter(Boolean))].sort();
    const sectors = [...new Set(retailers.map(r => r.sector).filter(Boolean))].sort();
    const channels = [...new Set(retailers.map(r => r.registration_channel).filter(Boolean))].sort();
    const statuses = [...new Set(retailers.map(r => r.status).filter(Boolean))].sort();

    // Calculate city analytics
    const cityAnalytics: { [key: string]: CityData } = {};
    
    filteredRetailers.forEach(retailer => {
      const city = retailer.retailer_city || 'Unknown';
      if (!cityAnalytics[city]) {
        cityAnalytics[city] = {
          city,
          retailers: 0,
          revenue: 0,
          orders: 0,
          avgOrderValue: 0,
          growth: 0,
          sectors: {},
          topRetailers: []
        };
      }
      
      cityAnalytics[city].retailers++;
      cityAnalytics[city].revenue += retailer.total_spent || 0;
      cityAnalytics[city].orders += retailer.total_order_count || 0;
      cityAnalytics[city].sectors[retailer.sector] = (cityAnalytics[city].sectors[retailer.sector] || 0) + 1;
      cityAnalytics[city].topRetailers.push(retailer);
    });

    // Calculate averages and sort top retailers
    Object.values(cityAnalytics).forEach(cityData => {
      cityData.avgOrderValue = cityData.orders > 0 ? cityData.revenue / cityData.orders : 0;
      cityData.topRetailers.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
      cityData.topRetailers = cityData.topRetailers.slice(0, 5);
      // Calculate growth (placeholder - could be based on date ranges)
      cityData.growth = Math.floor(Math.random() * 30) - 10; // -10 to +20%
    });

    // Sort cities based on selected criteria
    const sortedCities = Object.values(cityAnalytics).sort((a, b) => {
      switch (filters.sortBy) {
        case 'revenue': return b.revenue - a.revenue;
        case 'retailers': return b.retailers - a.retailers;
        case 'orders': return b.orders - a.orders;
        case 'growth': return b.growth - a.growth;
        default: return b.revenue - a.revenue;
      }
    });

    // Calculate totals
    const totalRevenue = sortedCities.reduce((sum, city) => sum + city.revenue, 0);
    const totalOrders = sortedCities.reduce((sum, city) => sum + city.orders, 0);

    return {
      cities: sortedCities,
      sectors,
      channels,
      statuses,
      filteredRetailers,
      totalRevenue,
      totalOrders
    };
  }, [retailers, orders, filters]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  // Revenue trend data (last 12 months)
  const revenueTrendData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        month: monthName,
        revenue: monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        orders: monthOrders.length
      });
    }
    
    return months;
  }, [orders]);

  // Sector distribution data
  const sectorData = useMemo(() => {
    if (!processedData.filteredRetailers || processedData.filteredRetailers.length === 0) {
      return [];
    }
    
    const sectorCount: { [key: string]: number } = {};
    processedData.filteredRetailers.forEach(retailer => {
      sectorCount[retailer.sector] = (sectorCount[retailer.sector] || 0) + 1;
    });
    
    return Object.entries(sectorCount).map(([sector, count]) => ({
      sector,
      count,
      percentage: Math.round((count / processedData.filteredRetailers.length) * 100)
    }));
  }, [processedData.filteredRetailers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <Navigation />
        <main className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Advanced Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Comprehensive insights into regional performance and business metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {processedData.filteredRetailers?.length || 0} Retailers
            </Badge>
            <Badge variant="outline" className="text-sm">
              ${(processedData.totalRevenue || 0).toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Filter className="w-5 h-5" />
              <span>Analytics Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <Label htmlFor="search">Search Retailers</Label>
                <Input
                  id="search"
                  placeholder="Search by name, city, salesperson..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>

              {/* City Filter */}
              <div>
                <Label htmlFor="city">City</Label>
                <Select value={filters.selectedCity} onValueChange={(value) => setFilters(prev => ({ ...prev, selectedCity: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {processedData.cities?.map((city) => (
                      <SelectItem key={city.city} value={city.city}>
                        {city.city} ({city.retailers})
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector Filter */}
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Select value={filters.selectedSector} onValueChange={(value) => setFilters(prev => ({ ...prev, selectedSector: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {processedData.sectors?.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.selectedStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, selectedStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {processedData.statuses?.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Registration Channel Filter */}
              <div>
                <Label htmlFor="channel">Registration Channel</Label>
                <Select value={filters.selectedChannel} onValueChange={(value) => setFilters(prev => ({ ...prev, selectedChannel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {processedData.channels?.map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        {channel}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <Label htmlFor="sort">Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="retailers">Retailer Count</SelectItem>
                    <SelectItem value="orders">Order Count</SelectItem>
                    <SelectItem value="growth">Growth Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    selectedCity: 'all',
                    selectedSector: 'all',
                    selectedStatus: 'all',
                    selectedChannel: 'all',
                    dateRange: 'all',
                    sortBy: 'revenue',
                    searchTerm: ''
                  })}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cities">City Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Store className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Retailers</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {processedData.filteredRetailers?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ${(processedData.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Package className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {processedData.totalOrders || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Target className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ${((processedData.totalRevenue || 0) / Math.max(processedData.totalOrders || 0, 1)).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Revenue Trend */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                    <TrendingUp className="w-5 h-5" />
                    <span>Revenue Trend (Last 12 Months)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sector Distribution */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                    <Building2 className="w-5 h-5" />
                    <span>Sector Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ sector, percentage }) => `${sector} (${percentage}%)`}
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* City Analysis Tab */}
          <TabsContent value="cities" className="space-y-6">
            {/* Top Cities Performance */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                  <MapPin className="w-5 h-5" />
                  <span>Top Cities Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={processedData.cities?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : name === 'retailers' ? 'Retailers' : 'Orders'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="retailers" fill="#8884d8" name="Retailers" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* City Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {processedData.cities?.slice(0, 6).map((cityData) => (
                <Card key={cityData.city} className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between dark:text-gray-100">
                      <span className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{cityData.city}</span>
                      </span>
                      <Badge variant={cityData.growth > 0 ? "default" : "destructive"}>
                        {cityData.growth > 0 ? '+' : ''}{cityData.growth}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Retailers</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{cityData.retailers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">${cityData.revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Orders</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{cityData.orders}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">${cityData.avgOrderValue.toFixed(0)}</p>
                        </div>
                      </div>
                      
                      {/* Top Retailers */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Top Retailers</p>
                        <div className="space-y-2">
                          {cityData.topRetailers.slice(0, 3).map((retailer) => (
                            <div key={retailer.id} className="flex justify-between items-center text-sm">
                              <span className="truncate dark:text-gray-300">
                                {retailer.reg_company_name.length > 20 
                                  ? retailer.reg_company_name.substring(0, 20) + '...' 
                                  : retailer.reg_company_name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                ${(retailer.total_spent || 0).toLocaleString()}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Revenue vs Orders Trend */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                  <Activity className="w-5 h-5" />
                  <span>Revenue vs Orders Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Orders" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Growth Radar Chart */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                  <Target className="w-5 h-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={processedData.cities?.slice(0, 5).map(city => ({
                    city: city.city,
                    revenue: city.revenue / 1000, // Normalize for radar chart
                    retailers: city.retailers * 10, // Scale up for visibility
                    orders: city.orders,
                    avgOrder: city.avgOrderValue
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="city" />
                    <PolarRadiusAxis />
                    <Radar name="Revenue (K)" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Retailers" dataKey="retailers" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="Orders" dataKey="orders" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Revenue Cities */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                    <Award className="w-5 h-5" />
                    <span>Top Revenue Cities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.cities?.slice(0, 8) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#00C49F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Retailer Count Cities */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                    <Users className="w-5 h-5" />
                    <span>Top Retailer Count Cities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processedData.cities?.slice(0, 8) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="retailers" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                  <BarChart3 className="w-5 h-5" />
                  <span>Performance Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {processedData.cities?.slice(0, 3).map((city, index) => (
                    <div key={city.city} className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{city.city}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          Revenue: <span className="font-medium text-gray-900 dark:text-gray-100">${city.revenue.toLocaleString()}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Retailers: <span className="font-medium text-gray-900 dark:text-gray-100">{city.retailers}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Growth: <span className={`font-medium ${city.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {city.growth > 0 ? '+' : ''}{city.growth}%
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CityAnalytics;
