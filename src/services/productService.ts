import { supabaseProductService } from './supabaseProductService';
import type { Product, ProductCategory, ProductType } from './supabaseProductService';

// Re-export the service and types
export type { Product, ProductCategory, ProductType };
export const productService = supabaseProductService;
