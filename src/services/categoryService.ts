import { supabase } from '../integrations/supabase/client';
import type { ProductCategory, ProductType } from './supabaseProductService';

class CategoryService {
  // Category Management
  async getCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async addCategory(category: Omit<ProductCategory, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .insert(category);
    
    if (error) throw error;
  }

  async updateCategory(id: string, updates: Partial<ProductCategory>): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Type Management
  async getTypes(): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async addType(type: Omit<ProductType, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('product_types')
      .insert(type);
    
    if (error) throw error;
  }

  async updateType(id: string, updates: Partial<ProductType>): Promise<void> {
    const { error } = await supabase
      .from('product_types')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  }

  async deleteType(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_types')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export const categoryService = new CategoryService(); 