import { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import MetricCard from '../components/MetricCard';
import RetailerTable from '../components/RetailerTable';
import RetailerGrowthChart from '../components/RetailerGrowthChart';
import SubscriptionGauge from '../components/SubscriptionGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  UserCheck,
  UserX,
  Clock,
  BarChart as BarChartIcon, 
  Calendar,
  Plus,
  FileText,
  Download,
  Settings,
  TrendingUp
} from 'lucide-react';
import {
  getRetailerStats,
  getRevenueByMonth,
  getSalespersonStats,
  getSectorDistribution,
  getRegistrationChannelStats,
  getEmailMarketingStats,
  getTopCities,
  Retailer
} from '../data/mockData';
import { dataService } from '../services/dataService';

const Dashboard = () => {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [orders, setOrders] = useState([]);
  const [retailerStats, setRetailerStats] = useState<any>({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [salespersonData, setSalespersonData] = useState<any[]>([]);
  const [salespersonStats, setSalespersonStats] = useState<any>({ total: 0, active: 0, topPerformer: '' });
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [topCities, setTopCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [retailersData, ordersData] = await Promise.all([
          dataService.getRetailers(),
          dataService.getOrders()
        ]);
        setRetailers(retailersData);
        setOrders(ordersData);

        // Load all statistical data
        const [
          retailerStatsData,
          salespersonStatsData,
          sectorStatsData,
          channelStatsData,
          topCitiesData
        ] = await Promise.all([
          getRetailerStats(),
          getSalespersonStats(),
          getSectorDistribution(),
          getRegistrationChannelStats(),
          getTopCities()
        ]);

        setRetailerStats(retailerStatsData);
        
        // Handle salesperson data - convert stats to chart format
        setSalespersonStats(salespersonStatsData);
        
        // Create chart data from retailers by counting assignments per salesperson
        const salespersonCounts: { [key: string]: number } = {};
        retailersData.forEach(retailer => {
          const salesperson = retailer.salesperson || 'Unassigned';
          salespersonCounts[salesperson] = (salespersonCounts[salesperson] || 0) + 1;
        });
        
        const chartData = Object.entries(salespersonCounts)
          .filter(([name]) => name !== 'Not assigned')
          .map(([name, count]) => ({ name, retailerCount: count }))
          .slice(0, 5); // Limit to top 5
        
        setSalespersonData(chartData);
        setSectorData(sectorStatsData);
        setChannelData(channelStatsData);
        setTopCities(topCitiesData.slice(0, 6));
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

  const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;

  const statusData = [
    { name: 'Approved', value: retailerStats.approved, color: 'var(--theme-active, #22c55e)' },
    { name: 'Pending', value: retailerStats.pending, color: 'var(--theme-accent, #f59e0b)' },
    { name: 'Rejected', value: retailerStats.rejected, color: 'var(--theme-inactive, #ef4444)' }
  ];

  const sectorChartData = sectorData.map((item, index) => ({
    name: item.sector,
    value: item.count,
    color: ['var(--theme-primary, #4f46e5)', 'var(--theme-accent, #06b6d4)', 'var(--theme-active, #10b981)'][index % 3]
  }));

  const topCitiesChartData = topCities.map((city, index) => ({
    name: city.city,
    retailers: city.count,
    color: `hsl(${(index * 60) % 360}, 70%, 50%)`
  }));

  // Navigation handlers for clickable metrics
  const handleMetricClick = (filter?: string) => {
    const url = filter ? `/retailers?status=${filter}` : '/retailers';
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <Navigation />
        <main className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (retailers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <Navigation />
        
        <main className="p-6">
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-6">
              Get started by importing retailer data or adding retailers manually.
            </p>
            <div className="space-x-4">
              <a
                href="/data-management"
                className="inline-flex items-center px-4 py-2 bg-theme-primary text-white rounded-md hover:bg-theme-primary/90"
              >
                Import Data
              </a>
              <a
                href="/retailers"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Add Retailer
              </a>
            </div>
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
        {/* Overview Metrics - Now Clickable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Total Retailers"
            value={retailerStats.total}
            subtitle="All registered companies"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            clickable={true}
            onClick={() => handleMetricClick()}
          />
          <MetricCard
            title="Approved Retailers"
            value={retailerStats.approved}
            subtitle="Currently approved"
            icon={UserCheck}
            trend={{ value: 8, isPositive: true }}
            clickable={true}
            onClick={() => handleMetricClick('approved')}
          />
          <MetricCard
            title="Pending Retailers"
            value={retailerStats.pending}
            subtitle="Awaiting approval"
            icon={Clock}
            trend={{ value: 3, isPositive: false }}
            clickable={true}
            onClick={() => handleMetricClick('pending')}
          />
          <MetricCard
            title="Rejected Retailers"
            value={retailerStats.rejected}
            subtitle="Application rejected"
            icon={UserX}
            trend={{ value: 1, isPositive: false }}
            clickable={true}
            onClick={() => handleMetricClick('rejected')}
          />
        </div>

        {/* Retailer Growth Chart */}
        <RetailerGrowthChart />

        {/* Charts Row 1 - Top Cities, Sector Distribution, Subscription Status Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Top Cities by Retailer Count */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top Cities by Retailer Count</CardTitle>
            </CardHeader>
            <CardContent>
              {topCitiesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topCitiesChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="retailers"
                    >
                      {topCitiesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No city data available
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {topCitiesChartData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}: {item.retailers}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sector Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Sector Distribution</CardTitle>
              <p className="text-sm text-gray-600">Retailer sectors breakdown</p>
            </CardHeader>
            <CardContent>
              {sectorData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sectorChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sectorChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {sectorData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sectorChartData[index]?.color }}
                          />
                          <span className="text-sm">{item.sector}</span>
                        </div>
                        <span className="text-sm font-medium">{item.count} ({item.percentage.toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-sm">No sector data available</div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Status Gauge */}
          <SubscriptionGauge />
        </div>

        {/* Charts Row 2 - Salesperson Performance, Registration Channels, System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Salesperson Performance */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Salesperson Performance</CardTitle>
              <p className="text-sm text-gray-600">Number of retailers assigned</p>
            </CardHeader>
            <CardContent>
              {salespersonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salespersonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Retailers']} />
                    <Bar dataKey="retailerCount" fill="var(--theme-primary, #228B22)" name="Retailers Assigned" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No salesperson data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Channels */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Registration Channels</CardTitle>
              <p className="text-sm text-gray-600">Registration source distribution</p>
            </CardHeader>
            <CardContent>
              {channelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}`, 'Retailers']} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="var(--theme-primary, #4f46e5)"
                      dot={{ fill: 'var(--theme-primary, #4f46e5)', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No channel data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="font-medium">${totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="font-medium">{totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Retailers</span>
                  <span className="font-medium">{retailerStats.approved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Registration Channels</span>
                  <span className="font-medium">{channelData.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Recent Retailers Table */}
        <RetailerTable />
      </main>
    </div>
  );
};

export default Dashboard;
