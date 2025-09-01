import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '../services/dataService';
import { Loader2 } from 'lucide-react';

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderAdded?: () => void;
}

const AddOrderDialog = ({ open, onOpenChange, onOrderAdded }: AddOrderDialogProps) => {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; product_name: string; flavour: string; price: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    retailer_id: '',
    order_number: '',
    order_date: new Date().toISOString().split('T')[0],
    product_id: '',
    quantity: '1',
    unit_price: '0',
    subtotal: '0',
    tax_amount: '0',
    total_amount: '0',
    status: 'Pending',
    payment_status: 'Pending',
    shipping_address: '',
    salesperson: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          const [retailersData, salespersonsData, productsData] = await Promise.all([
            dataService.getRetailers(),
            dataService.getSalespersons(),
            dataService.getProductsForOrder()
          ]);
          setRetailers(retailersData);
          setSalespersons(salespersonsData);
          setProducts(productsData);
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      }
    };

    loadData();
  }, [open]);

  // Auto-populate salesperson when retailer is selected
  useEffect(() => {
    if (formData.retailer_id) {
      const selectedRetailer = retailers.find(r => r.id === formData.retailer_id);
      if (selectedRetailer && selectedRetailer.salesperson) {
        setFormData(prev => ({
          ...prev,
          salesperson: selectedRetailer.salesperson
        }));
      }
    }
  }, [formData.retailer_id, retailers]);

  // Auto-populate unit price when product is selected
  useEffect(() => {
    if (formData.product_id) {
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          unit_price: selectedProduct.price.toString()
        }));
      }
    }
  }, [formData.product_id, products]);

  // Auto-calculate totals when quantity, unit price, or tax changes
  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const taxAmount = parseFloat(formData.tax_amount) || 0;
    
    const subtotal = quantity * unitPrice;
    const total = subtotal + taxAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total_amount: total.toFixed(2)
    }));
  }, [formData.quantity, formData.unit_price, formData.tax_amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.retailer_id) {
      toast({
        title: "Validation Error",
        description: "Please select a retailer.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.product_id) {
      toast({
        title: "Validation Error",
        description: "Please select a product.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedRetailer = retailers.find(r => r.id === formData.retailer_id);
      const selectedProduct = products.find(p => p.id === formData.product_id);
      
      const orderData = {
        retailer_id: formData.retailer_id,
        retailer_name: selectedRetailer?.reg_company_name || 'Unknown Retailer',
        order_number: formData.order_number || `ORD-${Date.now()}`,
        order_date: formData.order_date,
        product_id: formData.product_id,
        product_name: selectedProduct?.product_name || '',
        flavour: selectedProduct?.flavour || '',
        quantity: parseInt(formData.quantity) || 1,
        unit_price: parseFloat(formData.unit_price) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        total_amount: parseFloat(formData.total_amount) || 0,
        status: formData.status as 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled',
        payment_status: formData.payment_status as 'Pending' | 'Paid' | 'Failed' | 'Refunded',
        shipping_address: formData.shipping_address || 'Not provided',
        salesperson: formData.salesperson || 'Not assigned'
      };

      await dataService.addOrder(orderData);
      
      toast({
        title: "Order Added",
        description: `Order ${orderData.order_number} has been created successfully.`,
      });
      
      // Reset form
      setFormData({
        retailer_id: '',
        order_number: '',
        order_date: new Date().toISOString().split('T')[0],
        product_id: '',
        quantity: '1',
        unit_price: '0',
        subtotal: '0',
        tax_amount: '0',
        total_amount: '0',
        status: 'Pending',
        payment_status: 'Pending',
        shipping_address: '',
        salesperson: ''
      });
      
      onOpenChange(false);
      
      if (onOrderAdded) {
        onOrderAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add order.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="add-order-description"
      >
        <DialogHeader>
          <DialogTitle>Add New Order</DialogTitle>
        </DialogHeader>
        <div id="add-order-description" className="sr-only">
          Fill out the form to add a new order. All fields marked with * are required.
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retailer_id">Retailer *</Label>
              <Select 
                value={formData.retailer_id} 
                onValueChange={(value) => setFormData({ ...formData, retailer_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a retailer" />
                </SelectTrigger>
                <SelectContent>
                  {retailers.map(retailer => (
                    <SelectItem key={retailer.id} value={retailer.id}>
                      {retailer.reg_company_name || retailer.store_name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="order_number">Order Number</Label>
              <Input
                id="order_number"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                placeholder="Auto-generated if empty"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order_date">Order Date *</Label>
              <Input
                id="order_date"
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="salesperson">Salesperson (Auto-filled)</Label>
              <Input
                id="salesperson"
                value={formData.salesperson}
                onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                placeholder="Will be auto-filled when retailer is selected"
                className="bg-gray-50"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_id">Product *</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span>{product.product_name} - {product.flavour}</span>
                        <span className="text-xs text-gray-500">£{product.price.toFixed(2)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unit_price">Unit Price (Auto-filled)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0.00"
                className="bg-gray-50"
                readOnly
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="subtotal">Subtotal (Auto-calculated)</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={formData.subtotal}
                placeholder="0.00"
                className="bg-gray-50"
                readOnly
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="tax_amount">Tax Amount</Label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_amount">Total Amount (Auto-calculated)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                placeholder="0.00"
                className="bg-gray-50 font-semibold text-lg"
                readOnly
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select 
                value={formData.payment_status} 
                onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="shipping_address">Shipping Address</Label>
              <Input
                id="shipping_address"
                value={formData.shipping_address}
                onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                placeholder="Enter shipping address"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The salesperson field will be automatically populated based on the selected retailer's assigned salesperson. 
              Product price will be auto-filled when a product is selected, and totals will be calculated automatically.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-theme-primary hover:bg-theme-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Order...
                </>
              ) : (
                'Add Order'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
