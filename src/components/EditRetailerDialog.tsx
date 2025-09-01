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

interface EditRetailerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailer: any | null;
  onRetailerUpdated?: () => void;
}

type SectorType = 'Vape Shop' | 'Convenience Store' | 'Not Provided';
type StatusType = 'Approved' | 'Pending' | 'Rejected';
type ChannelType = 'Website' | 'POS' | 'Manual';
type MarketingType = 'Subscribed' | 'Unsubscribed';

const EditRetailerDialog = ({ open, onOpenChange, retailer, onRetailerUpdated }: EditRetailerDialogProps) => {
  const [formData, setFormData] = useState({
    date_created: '',
    reg_company_name: '',
    store_name: '',
    contact_person: '',
    sector: 'Not Provided' as SectorType,
    email: '',
    phone_number: '',
    status: 'Pending' as StatusType,
    address_1: '',
    address_2: '',
    retailer_city: '',
    retailer_postcode: '',
    country: '',
    registration_channel: 'Manual' as ChannelType,
    email_marketing: 'Unsubscribed' as MarketingType,
    salesperson: '',
    assigned_products: [] as string[]
  });
  
  const [cities, setCities] = useState<any[]>([]);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (retailer && open) {
      setIsLoading(true);
      const newFormData = {
        date_created: retailer.date_created || '',
        reg_company_name: retailer.reg_company_name || '',
        store_name: retailer.store_name || '',
        contact_person: retailer.contact_person || '',
        sector: retailer.sector || 'Not Provided',
        email: retailer.email || '',
        phone_number: retailer.phone_number || '',
        status: retailer.status || 'Pending',
        address_1: retailer.address_1 || '',
        address_2: retailer.address_2 || '',
        retailer_city: retailer.retailer_city || '',
        retailer_postcode: retailer.retailer_postcode || '',
        country: retailer.country || '',
        registration_channel: retailer.registration_channel || 'Manual',
        email_marketing: retailer.email_marketing || 'Unsubscribed',
        salesperson: retailer.salesperson || '',
        assigned_products: retailer.assigned_products || []
      };
      
      setFormData(newFormData);
      setIsLoading(false);
    } else if (open && !retailer) {
      // Dialog is open but no retailer data yet - show loading
      setIsLoading(true);
    } else if (!open) {
      // Dialog closed - reset loading state
      setIsLoading(false);
    }
  }, [retailer, open]);

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
    
    if (!retailer) return;

    try {
      const success = await dataService.updateRetailer(retailer.id, {
        ...formData,
        assigned_products: formData.assigned_products
      });

      if (success) {
        toast({
          title: "Retailer Updated",
          description: `${formData.reg_company_name} has been updated successfully.`,
        });
        
        onOpenChange(false);
        
        if (onRetailerUpdated) {
          onRetailerUpdated();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update retailer.",
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

  if (!retailer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Retailer</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading retailer data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="registration_channel">Registration Channel</Label>
                <Select value={formData.registration_channel} onValueChange={(value: string) => setFormData({ ...formData, registration_channel: value as ChannelType })}>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value as StatusType })}>
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
                <Label htmlFor="sector">Sector</Label>
                <Select value={formData.sector} onValueChange={(value: string) => setFormData({ ...formData, sector: value as SectorType })}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="email_marketing">Email Marketing</Label>
                <Select value={formData.email_marketing} onValueChange={(value: string) => setFormData({ ...formData, email_marketing: value as MarketingType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Subscribed">Subscribed</SelectItem>
                    <SelectItem value="Unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retailer_city">City</Label>
                <Input
                  id="retailer_city"
                  value={formData.retailer_city}
                  onChange={(e) => setFormData({ ...formData, retailer_city: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="retailer_postcode">Postcode</Label>
                <Input
                  id="retailer_postcode"
                  value={formData.retailer_postcode}
                  onChange={(e) => setFormData({ ...formData, retailer_postcode: e.target.value })}
                />
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
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-theme-primary text-white hover:bg-theme-primary/90">
                Update Retailer
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditRetailerDialog;
