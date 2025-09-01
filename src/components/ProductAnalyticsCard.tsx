
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, TrendingUp, Award } from 'lucide-react';

interface ProductAnalyticsCardProps {
  retailers: any[];
  products: any[];
}

const ProductAnalyticsCard = ({ retailers, products }: ProductAnalyticsCardProps) => {
  // Calculate most stocked device brands per region
  const getDeviceBrandsByRegion = () => {
    const regionBrands = new Map<string, Map<string, number>>();
    
    retailers.forEach(retailer => {
      const city = retailer.retailer_city;
      if (!regionBrands.has(city)) {
        regionBrands.set(city, new Map());
      }
      
      const cityBrands = regionBrands.get(city)!;
      
      (retailer.assigned_products || []).forEach((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
          const brand = product.product_name;
          cityBrands.set(brand, (cityBrands.get(brand) || 0) + 1);
        }
      });
    });

    const result = Array.from(regionBrands.entries()).map(([city, brands]) => {
      const topBrand = Array.from(brands.entries()).sort((a, b) => b[1] - a[1])[0];
      return {
        city: city.length > 12 ? city.substring(0, 12) + '...' : city,
        brand: topBrand ? topBrand[0] : 'None',
        count: topBrand ? topBrand[1] : 0
      };
    }).filter(item => item.count > 0).slice(0, 8);

    return result;
  };

  // Calculate top flavours by city
  const getTopFlavoursByCity = () => {
    const cityFlavours = new Map<string, Map<string, number>>();
    
    retailers.forEach(retailer => {
      const city = retailer.retailer_city;
      if (!cityFlavours.has(city)) {
        cityFlavours.set(city, new Map());
      }
      
      const flavours = cityFlavours.get(city)!;
      
      (retailer.assigned_products || []).forEach((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
          flavours.set(product.flavour, (flavours.get(product.flavour) || 0) + 1);
        }
      });
    });

    const result: any[] = [];
    cityFlavours.forEach((flavours, city) => {
      const topFlavours = Array.from(flavours.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      topFlavours.forEach(([flavour, count]) => {
        result.push({
          city: city.length > 10 ? city.substring(0, 10) + '...' : city,
          flavour: flavour.length > 15 ? flavour.substring(0, 15) + '...' : flavour,
          count
        });
      });
    });

    return result.slice(0, 10);
  };

  // Calculate nicotine strength distribution
  const getNicotineStrengthDistribution = () => {
    const strengthCount = new Map<string, number>();
    
    retailers.forEach(retailer => {
      (retailer.assigned_products || []).forEach((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product && product.nicotine_strength) {
          const strength = product.nicotine_strength;
          strengthCount.set(strength, (strengthCount.get(strength) || 0) + 1);
        }
      });
    });

    return Array.from(strengthCount.entries())
      .map(([strength, count]) => ({ strength, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const deviceBrands = getDeviceBrandsByRegion();
  const topFlavours = getTopFlavoursByCity();
  const nicotineStrengths = getNicotineStrengthDistribution();

  const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const chartConfig = {
    count: {
      label: "Count",
      color: "#00C49F",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {/* Most Stocked Device Brands */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium dark:text-gray-100">
            Most Stocked Brands by City
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {deviceBrands.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceBrands}>
                  <XAxis 
                    dataKey="city" 
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#00C49F" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No product data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Flavours */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium dark:text-gray-100">
            Top Flavours by Location
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {topFlavours.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFlavours} layout="horizontal">
                  <XAxis type="number" fontSize={10} />
                  <YAxis 
                    dataKey="flavour" 
                    type="category" 
                    fontSize={8}
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#0088FE" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No flavour data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nicotine Strength Distribution */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium dark:text-gray-100">
            Nicotine Strength Distribution
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {nicotineStrengths.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nicotineStrengths}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ strength, percent }) => 
                      `${strength} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                    fontSize={10}
                  >
                    {nicotineStrengths.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No nicotine strength data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductAnalyticsCard;
