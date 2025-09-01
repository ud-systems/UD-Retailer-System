import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { dataService } from '../services/dataService';

type TimeGranularity = 'day' | 'week' | 'month' | 'year';

const RetailerGrowthChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [granularity, setGranularity] = useState<TimeGranularity>('month');
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date, granularity: TimeGranularity): string => {
    switch (granularity) {
      case 'day':
        return date.toISOString().slice(0, 10); // YYYY-MM-DD
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      case 'month':
        return date.toISOString().slice(0, 7); // YYYY-MM
      case 'year':
        return date.toISOString().slice(0, 4); // YYYY
      default:
        return date.toISOString().slice(0, 7);
    }
  };

  const formatDisplayDate = (dateKey: string, granularity: TimeGranularity): string => {
    switch (granularity) {
      case 'day':
        return new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        const weekDate = new Date(dateKey);
        return `Week of ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return new Date(dateKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'year':
        return dateKey;
      default:
        return dateKey;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const retailers = await dataService.getRetailers();
        
        if (retailers.length === 0) {
          setChartData([]);
          setIsLoading(false);
          return;
        }

        // Group retailers by selected granularity
        const groupedData: { [key: string]: number } = {};
        
        for (const retailer of retailers) {
          const date = new Date(retailer.date_created);
          const dateKey = formatDate(date, granularity);
          groupedData[dateKey] = (groupedData[dateKey] || 0) + 1;
        }

        // Convert to chart format and calculate cumulative growth
        const sortedDates = Object.keys(groupedData).sort();
        let cumulative = 0;
        const data = sortedDates.map(dateKey => {
          cumulative += groupedData[dateKey];
          return {
            date: dateKey,
            displayDate: formatDisplayDate(dateKey, granularity),
            retailers: cumulative,
            newRetailers: groupedData[dateKey]
          };
        });

        setChartData(data);
      } catch (error) {
        console.error('Failed to load retailer growth data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    const handleDataChange = () => loadData();
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, [granularity]);

  const GranularityToggle = () => (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {(['day', 'week', 'month', 'year'] as TimeGranularity[]).map((option) => (
        <button
          key={option}
          onClick={() => setGranularity(option)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
            granularity === option
              ? 'bg-white dark:bg-gray-700 text-theme-primary shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <Card className="shadow-md rounded-xl border-0 bg-white dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-theme-primary" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Retailer Growth Over Time
            </CardTitle>
          </div>
          <GranularityToggle />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Cumulative retailer registrations by {granularity}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--theme-primary, #228B22)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--theme-primary, #228B22)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--theme-accent, #82ca9d)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--theme-accent, #82ca9d)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-secondary, #f0f0f0)" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12, fill: '#374151' }}
                angle={granularity === 'day' ? -45 : 0}
                textAnchor={granularity === 'day' ? 'end' : 'middle'}
                height={granularity === 'day' ? 60 : 30}
                interval="preserveStartEnd"
                label={{ 
                  value: granularity === 'day' ? 'Date' : granularity === 'week' ? 'Week' : granularity === 'month' ? 'Month' : 'Year', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { fontSize: 14, fontWeight: 'bold', fill: '#374151' }
                }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: 'Number of Retailers', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 10,
                  style: { fontSize: 14, fontWeight: 'bold', fill: '#374151' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--theme-secondary, #ffffff)', 
                  border: '1px solid var(--theme-border, #e5e7eb)',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => `Period: ${value}`}
                formatter={(value, name) => [
                  value, 
                  name === 'retailers' ? 'Total Retailers' : 'New Retailers'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="retailers" 
                stroke="var(--theme-primary, #228B22)" 
                strokeWidth={3}
                fill="url(#colorGrowth)"
                name="Total Retailers"
                dot={{ fill: 'var(--theme-primary, #228B22)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--theme-primary, #228B22)', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="newRetailers" 
                stroke="var(--theme-accent, #82ca9d)" 
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="New Retailers"
                dot={{ fill: 'var(--theme-accent, #82ca9d)', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: 'var(--theme-accent, #82ca9d)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No growth data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RetailerGrowthChart;
