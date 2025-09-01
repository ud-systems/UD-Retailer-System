import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface Product {
  id: string;
  product_name: string;
  product_type: string;
  category: string;
  nicotine_strength: string;
  flavour: string;
  price: number;
  category_id?: string;
  type_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

export interface ProductType {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

type DBProduct = Database['public']['Tables']['products']['Row'];
type DBProductInsert = Database['public']['Tables']['products']['Insert'];

class SupabaseProductService {
  private eventListeners: Map<string, Function[]> = new Map();

  // Event handling for backward compatibility
  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private dispatchEvent(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  private convertDBProductToLegacy(dbProduct: DBProduct): Product {
    return {
      id: dbProduct.id,
      product_name: dbProduct.product_name,
      product_type: dbProduct.product_type as string,
      category: dbProduct.category as string,
      nicotine_strength: dbProduct.nicotine_strength || '',
      flavour: dbProduct.flavour,
      price: Number(dbProduct.price) || 0,
      category_id: dbProduct.category_id,
      type_id: dbProduct.type_id,
      created_at: dbProduct.created_at,
      updated_at: dbProduct.updated_at
    };
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name),
        product_types(name)
      `)
      .order('product_name');
    
    if (error) throw error;
    
    return data?.map(product => ({
      id: product.id,
      product_name: product.product_name,
      product_type: product.product_types?.name || product.product_type || 'Unknown',
      category: product.product_categories?.name || product.category || 'Unknown',
      nicotine_strength: product.nicotine_strength,
      flavour: product.flavour,
      price: Number(product.price) || 0,
      category_id: product.category_id,
      type_id: product.type_id,
      created_at: product.created_at,
      updated_at: product.updated_at
    })) || [];
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name),
        product_types(name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      product_name: data.product_name,
      product_type: data.product_types?.name || data.product_type || 'Unknown',
      category: data.product_categories?.name || data.category || 'Unknown',
      nicotine_strength: data.nicotine_strength,
      flavour: data.flavour,
      price: Number(data.price) || 0,
      category_id: data.category_id,
      type_id: data.type_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async addProduct(productData: Omit<Product, 'id'>): Promise<void> {
    try {
      // Get category and type IDs if names are provided
      let categoryId = productData.category_id;
      let typeId = productData.type_id;
      
      if (!categoryId && productData.category) {
        const { data: category, error: catError } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', productData.category)
          .eq('is_active', true)
          .single();
        
        if (catError || !category) {
          throw new Error(`Category "${productData.category}" not found or not active`);
        }
        categoryId = category.id;
      }
      
      if (!typeId && productData.product_type) {
        const { data: type, error: typeError } = await supabase
          .from('product_types')
          .select('id')
          .eq('name', productData.product_type)
          .eq('is_active', true)
          .single();
        
        if (typeError || !type) {
          throw new Error(`Product type "${productData.product_type}" not found or not active`);
        }
        typeId = type.id;
      }
      
      // Validate that we have both IDs
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      if (!typeId) {
        throw new Error('Product type ID is required');
      }
      
      // Insert the product with all required fields
      const insertData = {
        product_name: productData.product_name,
        product_type: productData.product_type,
        category: productData.category,
        nicotine_strength: productData.nicotine_strength,
        flavour: productData.flavour,
        price: productData.price,
        category_id: categoryId,
        type_id: typeId
      };
      
      const { error } = await supabase
        .from('products')
        .insert(insertData);
      
      if (error) {
        console.error('Error adding product:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in addProduct:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    try {
      // Get category and type IDs if names are provided
      let categoryId = updates.category_id;
      let typeId = updates.type_id;
      
      if (!categoryId && updates.category) {
        const { data: category, error: catError } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', updates.category)
          .eq('is_active', true)
          .single();
        
        if (catError || !category) {
          console.error('Error finding category:', catError);
          throw new Error(`Category "${updates.category}" not found or not active`);
        }
        categoryId = category.id;
      }
      
      if (!typeId && updates.product_type) {
        const { data: type, error: typeError } = await supabase
          .from('product_types')
          .select('id')
          .eq('name', updates.product_type)
          .eq('is_active', true)
          .single();
        
        if (typeError || !type) {
          console.error('Error finding product type:', typeError);
          throw new Error(`Product type "${updates.product_type}" not found or not active`);
        }
        typeId = type.id;
      }
      
      const updateData: any = {};
      if (updates.product_name) updateData.product_name = updates.product_name;
      if (updates.product_type) updateData.product_type = updates.product_type;
      if (updates.category) updateData.category = updates.category;
      if (updates.nicotine_strength !== undefined) updateData.nicotine_strength = updates.nicotine_strength;
      if (updates.flavour) updateData.flavour = updates.flavour;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (categoryId) updateData.category_id = categoryId;
      if (typeId) updateData.type_id = typeId;
      
      console.log('Updating product with data:', updateData);
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating product:', error);
        return false;
      }
      
      // Dispatch event to notify other components
      this.dispatchEvent('dataChanged', { type: 'products' });
      
      return true;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      return false;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      // First check if the product exists and get its details for logging
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('product_name')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching product for deletion:', fetchError);
        return false;
      }
      
      // Delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }
      
      console.log(`Product "${product?.product_name}" deleted successfully`);
      
      // Dispatch event to notify other components
      this.dispatchEvent('dataChanged', { type: 'products' });
      
      return true;
    } catch (error) {
      console.error('Unexpected error deleting product:', error);
      return false;
    }
  }

  async getCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  }

  async getTypes(): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  }

  async getProductsForOrder(): Promise<Array<{ id: string; product_name: string; flavour: string; price: number }>> {
    const { data, error } = await supabase
      .from('products')
      .select('id, product_name, flavour, price')
      .order('product_name');
    
    if (error) throw error;
    
    return data?.map(product => ({
      id: product.id,
      product_name: product.product_name,
      flavour: product.flavour,
      price: Number(product.price) || 0
    })) || [];
  }

  // CSV Export functionality
  exportToCSV(): string {
    // This will be implemented with the actual data from Supabase
    return this.generateCSV([]);
  }

  private generateCSV(products: Product[]): string {
    const headers = ['Product Name', 'Type', 'Category', 'Nicotine Strength', 'Flavour', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        `"${product.product_name}"`,
        `"${product.product_type}"`,
        `"${product.category}"`,
        `"${product.nicotine_strength}"`,
        `"${product.flavour}"`,
        `"${product.created_at}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // CSV Import functionality
  async importFromCSV(csvContent: string, createdBy: string): Promise<{ success: number; errors: string[] }> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const dataLines = lines.slice(1);

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length < 6) {
          errors.push(`Row ${i + 2}: Insufficient data (need at least 6 columns)`);
          continue;
        }

        const productData = {
          product_name: values[0],
          product_type: values[1],
          category: values[2],
          nicotine_strength: values[3],
          flavour: values[4],
          price: parseFloat(values[5]) || 0
        };

        // Validate product_type
        if (!['Disposable', 'Closed Pod', 'Open System'].includes(productData.product_type)) {
          errors.push(`Row ${i + 2}: Invalid product type "${values[1]}"`);
          continue;
        }

        // Validate category
        if (!['Disposable', 'Refillable'].includes(productData.category)) {
          errors.push(`Row ${i + 2}: Invalid category "${values[2]}"`);
          continue;
        }

        // Validate price
        if (productData.price < 0) {
          errors.push(`Row ${i + 2}: Invalid price "${values[5]}" (must be positive)`);
          continue;
        }

        await this.addProduct(productData);
        success++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success, errors };
  }

  // Search functionality
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`product_name.ilike.%${query}%,flavour.ilike.%${query}%,product_type.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(product => this.convertDBProductToLegacy(product)) || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(product => this.convertDBProductToLegacy(product)) || [];
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  // Get products by type
  async getProductsByType(type: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(product => this.convertDBProductToLegacy(product)) || [];
    } catch (error) {
      console.error('Error getting products by type:', error);
      return [];
    }
  }
}

export const supabaseProductService = new SupabaseProductService();
