import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle } from 'lucide-react';

interface CityMapProps {
  cities: Array<{ city: string; orders: number; revenue: number; }>;
}

const CityMap = ({ cities }: CityMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      // In a real implementation, this would initialize the actual map
      console.log('Initializing map with token:', mapboxToken);
    }
  };

  if (showTokenInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-theme-primary" />
            <span>City Performance Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Mapbox Token Required</h4>
                <p className="text-sm text-amber-700 mt-1">
                  To display the interactive map, please enter your Mapbox public token below. 
                  You can get one from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mapboxToken">Mapbox Public Token</Label>
            <Input
              id="mapboxToken"
              type="password"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="pk.eyJ1IjoibXl1c2VybmFtZSIsImEiOiJja..."
            />
          </div>
          
          <Button 
            onClick={handleTokenSubmit}
            disabled={!mapboxToken.trim()}
            className="bg-theme-primary text-white hover:bg-theme-primary/90"
          >
            Initialize Map
          </Button>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">City Data Preview:</h4>
            <div className="space-y-2">
              {cities.slice(0, 5).map((city, index) => (
                <div key={city.city} className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-theme-primary" />
                    {city.city}
                  </span>
                  <span className="text-gray-600">
                    {city.orders} orders • ${city.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-theme-primary" />
          <span>City Performance Map</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapContainer} 
          className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center"
        >
          <div className="text-center">
            <MapPin className="w-12 h-12 text-theme-primary mx-auto mb-2" />
            <p className="text-gray-600">Interactive map will load here</p>
            <p className="text-sm text-gray-500">Map integration ready for Mapbox API</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CityMap;
