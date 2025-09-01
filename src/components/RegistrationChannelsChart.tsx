
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Globe } from 'lucide-react';
import { dataService } from '../services/dataService';

const RegistrationChannelsChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const retailers = await dataService.getRetailers();
        
        // Count registration channels
        const channelCounts: { [key: string]: number } = {};
        
        retailers.forEach(retailer => {
          const channel = retailer.registration_channel || 'Unknown';
          channelCounts[channel] = (channelCounts[channel] || 0) + 1;
        });

        // Convert to chart format
        const data = Object.entries(channelCounts).map(([channel, count], index) => ({
          name: channel,
          value: count,
          color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]
        }));

        setChartData(data);
      } catch (error) {
        console.error('Failed to load registration channels data:', error);
      }
    };

    loadData();
    
    const handleDataChange = () => loadData();
    window.addEventListener('dataChanged', handleDataChange);
    return () => window.removeEventListener('dataChanged', handleDataChange);
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="w-5 h-5" />
          <span>Registration Channels</span>
        </CardTitle>
        <p className="text-sm text-gray-600">How retailers are registering</p>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            No registration data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationChannelsChart;
