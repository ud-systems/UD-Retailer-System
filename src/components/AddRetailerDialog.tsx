import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '../services/dataService';
import { cityService } from '../services/cityService';
import { productService } from '../services/productService';
import { userService } from '../services/userService';

interface AddRetailerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetailerAdded?: () => void;
}

const AddRetailerDialog = ({ open, onOpenChange, onRetailerAdded }: AddRetailerDialogProps) => {
  const [formData, setFormData] = useState({
    date_created: new Date().toISOString().split('T')[0],
    reg_company_name: '',
    store_name: '',
    contact_person: '',
    sector: '',
    email: '',
    phone_number: '',
    status: 'Pending',
    address_1: '',
    address_2: '',
    retailer_city: '',
    retailer_postcode: '',
    country: '',
    registration_channel: 'Manual',
    email_marketing: 'Unsubscribed',
    salesperson: '',
    assigned_products: [] as string[]
  });
  
  const [cities, setCities] = useState<any[]>([]);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<Record<string, any[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          const [citiesData, salespersonsData, productsData, salespersonUsersData] = await Promise.all([
            cityService.getCities(),
            dataService.getSalespersons(),
            productService.getProducts(),
            userService.getUsersByRole('salesperson')
          ]);
          
          setCities(citiesData);
          
          // Combine salespersons from both sources
          const combinedSalespersons = [
            // Legacy salespersons from salespersons table
            ...salespersonsData.map(sp => ({
              id: sp.id,
              name: sp.name,
              email: sp.email,
              source: 'legacy'
            })),
            // Users with salesperson role from profiles table
            ...salespersonUsersData
              .filter(user => user.status === 'active') // Only show active users
              .map(user => ({
                id: user.id,
                name: user.username,
                email: user.email,
                source: 'user'
              }))
          ];
          
          setSalespersons(combinedSalespersons);
          setProducts(productsData);
          
          // Group products
          const grouped = productsData.reduce((acc: Record<string, any[]>, product: any) => {
            const key = `${product.product_type} - ${product.product_name}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(product);
            return acc;
          }, {});
          
          setGroupedProducts(grouped);
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      }
    };

    loadData();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reg_company_name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Company name and email are required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.retailer_city) {
      toast({
        title: "Validation Error",
        description: "Please select a city from the dropdown.",
        variant: "destructive",
      });
      return;
    }

    try {
      const retailerData = {
        date_created: formData.date_created || new Date().toISOString().split('T')[0],
        reg_company_name: formData.reg_company_name || 'Not provided',
        store_name: formData.store_name || 'Not provided',
        contact_person: formData.contact_person || 'Not provided',
        sector: (formData.sector || 'Not Provided') as 'Vape Shop' | 'Convenience Store' | 'Not Provided',
        email: formData.email,
        phone_number: formData.phone_number || 'Not provided',
        status: formData.status as 'Approved' | 'Pending' | 'Rejected',
        address_1: formData.address_1 || 'Not provided',
        address_2: formData.address_2 || 'Not provided',
        retailer_city: formData.retailer_city,
        retailer_postcode: formData.retailer_postcode || 'Not provided',
        country: formData.country || 'Not provided',
        registration_channel: formData.registration_channel as 'Website' | 'POS' | 'Manual',
        email_marketing: formData.email_marketing as 'Subscribed' | 'Unsubscribed',
        total_order_count: 0,
        total_tax: 0,
        total_spent: 0,
        salesperson: formData.salesperson || 'Not assigned',
        assigned_products: formData.assigned_products
      };

      await dataService.addRetailer(retailerData);
      
      toast({
        title: "Retailer Added",
        description: `${retailerData.reg_company_name} has been added successfully.`,
      });
      
      // Reset form
      setFormData({
        date_created: new Date().toISOString().split('T')[0],
        reg_company_name: '',
        store_name: '',
        contact_person: '',
        sector: '',
        email: '',
        phone_number: '',
        status: 'Pending',
        address_1: '',
        address_2: '',
        retailer_city: '',
        retailer_postcode: '',
        country: '',
        registration_channel: 'Manual',
        email_marketing: 'Unsubscribed',
        salesperson: '',
        assigned_products: []
      });
      
      onOpenChange(false);
      
      if (onRetailerAdded) {
        onRetailerAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add retailer.",
        variant: "destructive",
      });
    }
  };

  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_products: prev.assigned_products.includes(productId)
        ? prev.assigned_products.filter(id => id !== productId)
        : [...prev.assigned_products, productId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Retailer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date_created">Date Created *</Label>
            <Input
              id="date_created"
              type="date"
              value={formData.date_created}
              onChange={(e) => setFormData({ ...formData, date_created: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-1">Auto-filled with today's date, but can be modified</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reg_company_name">Company Name *</Label>
              <Input
                id="reg_company_name"
                value={formData.reg_company_name}
                onChange={(e) => setFormData({ ...formData, reg_company_name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vape Shop">Vape Shop</SelectItem>
                  <SelectItem value="Convenience Store">Convenience Store</SelectItem>
                  <SelectItem value="Not Provided">Not Provided</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address_1">Address Line 1</Label>
              <Input
                id="address_1"
                value={formData.address_1}
                onChange={(e) => setFormData({ ...formData, address_1: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="address_2">Address Line 2</Label>
              <Input
                id="address_2"
                value={formData.address_2}
                onChange={(e) => setFormData({ ...formData, address_2: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="retailer_city">City *</Label>
              <Select value={formData.retailer_city} onValueChange={(value) => setFormData({ ...formData, retailer_city: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}, {city.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="retailer_postcode">Postal Code</Label>
              <Input
                id="retailer_postcode"
                value={formData.retailer_postcode}
                onChange={(e) => setFormData({ ...formData, retailer_postcode: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="registration_channel">Registration Channel</Label>
              <Select value={formData.registration_channel} onValueChange={(value) => setFormData({ ...formData, registration_channel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="email_marketing">Email Marketing</Label>
              <Select value={formData.email_marketing} onValueChange={(value) => setFormData({ ...formData, email_marketing: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Subscribed">Subscribed</SelectItem>
                  <SelectItem value="Unsubscribed">Unsubscribed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="salesperson">Assigned Salesperson</Label>
            <Select value={formData.salesperson} onValueChange={(value) => setFormData({ ...formData, salesperson: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select salesperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not assigned">Not assigned</SelectItem>
                {salespersons.map((salesperson) => (
                  <SelectItem key={salesperson.id} value={salesperson.name}>
                    <div className="flex flex-col">
                      <span>{salesperson.name}</span>
                      <span className="text-xs text-gray-500">
                        {salesperson.email} {salesperson.source === 'user' ? '(User)' : '(Legacy)'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Products & Flavours</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
              {Object.entries(groupedProducts).map(([productGroup, productList]) => (
                <div key={productGroup} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">{productGroup}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                    {productList.map((product) => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={product.id}
                          checked={formData.assigned_products.includes(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                        <label htmlFor={product.id} className="text-sm cursor-pointer">
                          {product.flavour} ({product.nicotine_strength})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No products available. Add products first to assign them to retailers.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {formData.assigned_products.length} products
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Fields marked with * are required. City must be selected from the available options.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-theme-primary text-white hover:bg-theme-primary/90">
              Add Retailer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRetailerDialog;
