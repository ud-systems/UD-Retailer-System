
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '../services/dataService';

interface AddSalespersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalespersonAdded?: () => void;
}

const AddSalespersonDialog = ({ open, onOpenChange, onSalespersonAdded }: AddSalespersonDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      dataService.addSalesperson(formData);
      
      console.log('Adding new salesperson:', formData);
      
      toast({
        title: "Salesperson Added",
        description: `${formData.name} has been added successfully.`,
      });
      
      // Reset form
      setFormData({ name: '', email: '', phone: '' });
      onOpenChange(false);
      
      // Trigger refresh if callback provided
      if (onSalespersonAdded) {
        onSalespersonAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add salesperson.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="add-salesperson-description"
      >
        <DialogHeader>
          <DialogTitle>Add New Salesperson</DialogTitle>
        </DialogHeader>
        <div id="add-salesperson-description" className="sr-only">
          Add a new salesperson to the system. Fill in the required fields marked with asterisks.
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> New salespersons will be added to the system and can be assigned to retailers.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-theme-primary hover:bg-theme-primary/90">
              Add Salesperson
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSalespersonDialog;
