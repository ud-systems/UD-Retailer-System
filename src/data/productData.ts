export interface Product {
  id: string;
  product_name: string;
  product_type: 'Disposable' | 'Closed Pod' | 'Open System';
  category: 'Disposable' | 'Refillable';
  nicotine_strength: string;
  flavour: string;
  price: number;
  created_at: string;
  updated_at: string;
}

// Empty array - products will be added by admins and managers
export const mockProducts: Product[] = [];
