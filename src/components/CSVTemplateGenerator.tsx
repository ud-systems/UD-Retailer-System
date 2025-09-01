import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Info } from 'lucide-react';
import { dataService } from '../services/dataService';

const CSVTemplateGenerator = () => {
  const [availableSalespersons, setAvailableSalespersons] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [salespersons, categories, types] = await Promise.all([
          dataService.getAvailableSalespersonNames(),
          dataService.getAvailableCategories(),
          dataService.getAvailableTypes()
        ]);
        setAvailableSalespersons(salespersons);
        setAvailableCategories(categories);
        setAvailableTypes(types);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const generateRetailerTemplate = () => {
    const headers = [
      'Retailer Name',
      'Phone Number',
      'Address Line 1',
      'Address Line 2',
      'City',
      'Postcode',
      'Country',
      'Registration Channel',
      'Email Marketing',
      'Salesperson Name'
    ];
    
    // Use actual salesperson names if available, otherwise use sample
    const sampleSalesperson = availableSalespersons.length > 0 
      ? availableSalespersons[0] 
      : 'Sample Salesperson';
    
    const sampleRow = [
      'Sample Vape Store Ltd',
      '+44-20-7123-4567',
      '123 Main Street',
      'Unit 4B',
      'London',
      'SW1A 1AA',
      'United Kingdom',
      'Manual',
      'Subscribed',
      sampleSalesperson
    ];

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    downloadCSV(csvContent, 'retailer_template.csv');
  };

  const generateOrderTemplate = () => {
    const headers = [
      'retailer_name',
      'order_number',
      'order_date',
      'total_amount',
      'tax_amount',
      'quantity',
      'status',
      'payment_status',
      'shipping_address',
      'salesperson'
    ];
    
    const sampleRow = [
      'Cloud Nine Vapes',
      'ORD-2024-001',
      '2024-01-15',
      '1250.00',
      '125.00',
      '50',
      'Delivered',
      'Paid',
      '123 Main Street, New York, NY 10001',
      'Sarah Johnson'
    ];

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    downloadCSV(csvContent, 'order_template.csv');
  };

  const generateProductTemplate = () => {
    const headers = [
      'Product Name',
      'Product Type',
      'Category',
      'Flavour',
      'Nicotine Strength',
      'Price'
    ];
    
    const sampleRows = [
      ['Elf Bar 600', 'Disposable', 'Disposable', 'Mango Ice', '20mg', '5.99'],
      ['JUUL Pod', 'Closed Pod', 'Refillable', 'Mint', '18mg', '3.99'],
      ['SMOK Nord', 'Open System', 'Refillable', 'Vanilla', '0mg', '25.99'],
      ['Vaporesso XROS', 'Pod System', 'Refillable', 'Strawberry', '12mg', '19.99'],
      ['Puff Bar Plus', 'Disposable', 'Disposable', 'Blue Razz', '50mg', '4.99']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => 
        row.map(value => {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    downloadCSV(csvContent, 'product_template.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-theme-primary" />
          <span>CSV Templates</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Download CSV templates with the correct format and sample data:
        </p>
        
        {/* Salesperson Validation Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Salesperson Validation
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                The salesperson field will be validated against existing salespersons in the system. 
                {availableSalespersons.length > 0 ? (
                  <span> Available salespersons: <strong>{availableSalespersons.join(', ')}</strong></span>
                ) : (
                  <span> Loading available salespersons...</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Product Validation Info */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                Product Validation
              </p>
              <div className="text-green-700 dark:text-green-300 space-y-1">
                <p>
                  <strong>Categories:</strong> {availableCategories.length > 0 ? availableCategories.join(', ') : 'Loading...'}
                </p>
                <p>
                  <strong>Product Types:</strong> {availableTypes.length > 0 ? availableTypes.join(', ') : 'Loading...'}
                </p>
                <p className="text-xs mt-2">
                  Product Name + Flavour combination must be unique in the system.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={generateRetailerTemplate}
            variant="outline"
            className="w-full justify-start hover:scale-105 transition-all duration-300 border-gray-300 dark:border-gray-600 hover:border-theme-primary dark:hover:border-theme-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Retailer Template
          </Button>
          <Button 
            onClick={generateOrderTemplate}
            variant="outline"
            className="w-full justify-start hover:scale-105 transition-all duration-300 border-gray-300 dark:border-gray-600 hover:border-theme-primary dark:hover:border-theme-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Order Template
          </Button>
          <Button 
            onClick={generateProductTemplate}
            variant="outline"
            className="w-full justify-start hover:scale-105 transition-all duration-300 border-gray-300 dark:border-gray-600 hover:border-theme-primary dark:hover:border-theme-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Product Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVTemplateGenerator;
