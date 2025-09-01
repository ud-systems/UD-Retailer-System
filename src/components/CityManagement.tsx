import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { supabaseCityService } from '../services/supabaseCityService';
import { useAuth } from '../contexts/AuthContext';

const CityManagement = () => {
  const [cities, setCities] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCity, setNewCity] = useState({ name: '', country: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await supabaseCityService.getCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to load cities:', error);
        toast({
          title: "Error",
          description: "Failed to load cities.",
          variant: "destructive",
        });
      }
    };

    loadCities();
  }, [toast]);

  const handleAddCity = async () => {
    if (!newCity.name || !newCity.country) {
      toast({
        title: "Validation Error",
        description: "City name and country are required.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add cities.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Adding city:', newCity, 'Created by:', user.username);
      
      const result = await supabaseCityService.addCity({
        name: newCity.name,
        country: newCity.country,
        created_by: user.username || 'unknown'
      });

      if (result) {
        const updatedCities = await supabaseCityService.getCities();
        setCities(updatedCities);
        setNewCity({ name: '', country: '' });
        setShowAddDialog(false);
        
        toast({
          title: "City Added",
          description: `${newCity.name}, ${newCity.country} has been added successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add city. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding city:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add city.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCity = async (id: string, cityName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${cityName}?`)) {
      return;
    }

    try {
      const success = await supabaseCityService.deleteCity(id);
      if (success) {
        const updatedCities = await supabaseCityService.getCities();
        setCities(updatedCities);
        
        toast({
          title: "City Deleted",
          description: `${cityName} has been deleted successfully.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete city.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: "Error",
        description: "Failed to delete city.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>City Management</span>
            </CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="bg-theme-primary text-white hover:bg-theme-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add City
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.country}</TableCell>
                  <TableCell>{city.created_by}</TableCell>
                  <TableCell>{new Date(city.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCity(city.id, city.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent aria-describedby="add-city-description">
          <DialogHeader>
            <DialogTitle>Add New City</DialogTitle>
          </DialogHeader>
          <div id="add-city-description" className="sr-only">
            Add a new city to the system. Fill in the city name and country.
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="city-name">City Name</Label>
              <Input
                id="city-name"
                value={newCity.name}
                onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                placeholder="Enter city name"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={newCity.country}
                onChange={(e) => setNewCity({ ...newCity, country: e.target.value })}
                placeholder="Enter country"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddCity} className="bg-theme-primary text-white hover:bg-theme-primary/90" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add City'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CityManagement;
