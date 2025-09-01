import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { supabaseProductService } from './supabaseProductService';
import { supabaseAuthService } from './supabaseAuthService';

type Retailer = Database['public']['Tables']['retailers']['Row'];
type RetailerInsert = Database['public']['Tables']['retailers']['Insert'];
type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type Salesperson = Database['public']['Tables']['salespersons']['Row'];
type SalespersonInsert = Database['public']['Tables']['salespersons']['Insert'];

// Interface to match current dataService interface exactly
interface LegacyRetailer {
  id: string;
  date_created: string;
  reg_company_name: string;
  store_name: string;
  contact_person: string;
  sector: 'Vape Shop' | 'Convenience Store' | 'Not Provided';
  email: string;
  phone_number: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  address_1: string;
  address_2: string;
  retailer_city: string;
  retailer_postcode: string;
  country: string;
  registration_channel: 'Website' | 'POS' | 'Manual';
  email_marketing: 'Subscribed' | 'Unsubscribed';
  total_order_count: number;
  total_tax: number;
  total_spent: number;
  salesperson: string;
  assigned_products?: string[];
}

interface LegacyOrder {
  id: string;
  order_number: string;
  retailer_id: string;
  retailer_name: string;
  order_date: string;
  total_amount: number;
  tax_amount: number;
  quantity: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  shipping_address: string;
  salesperson: string;
  product_id?: string;
  product_name?: string;
  flavour?: string;
  unit_price?: number;
}

interface LegacySalesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_created: string;
  total_revenue: number;
}

class SupabaseDataService {
  private async getCurrentUserRole(): Promise<string | null> {
    try {
      const currentUser = await supabaseAuthService.getCurrentUser();
      return currentUser?.role || null;
    } catch (error) {
      console.error('Error getting current user role:', error);
      return null;
    }
  }

  private async getCurrentUserSalespersonName(): Promise<string | null> {
    try {
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (currentUser?.role !== 'salesperson') return null;
      
      // Get the salesperson name for the current user
      const { data, error } = await supabase
        .from('salespersons')
        .select('name')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        console.error('Error getting salesperson name:', error);
        return null;
      }
      
      return data?.name || null;
    } catch (error) {
      console.error('Error getting current user salesperson name:', error);
      return null;
    }
  }

  async getRetailers(): Promise<LegacyRetailer[]> {
    // Get current user role and salesperson name for filtering
    const userRole = await this.getCurrentUserRole();
    const salespersonName = await this.getCurrentUserSalespersonName();
    
    let query = supabase
      .from('retailers')
      .select(`
        *,
        retailer_products (
          product_id,
          products (
            id
          )
        )
      `);
    
    // Apply role-based filtering
    if (userRole === 'salesperson' && salespersonName) {
      query = query.eq('salesperson', salespersonName);
    }
    // For admin and manager roles, no additional filtering is needed (RLS handles this)
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error in getRetailers:', error, { table: 'retailers' });
      throw error;
    }
    
    return data?.map(retailer => ({
      id: retailer.id,
      date_created: retailer.date_created || new Date().toISOString().split('T')[0],
      reg_company_name: retailer.reg_company_name,
      store_name: retailer.store_name,
      contact_person: retailer.contact_person,
      sector: retailer.sector as 'Vape Shop' | 'Convenience Store' | 'Not Provided',
      email: retailer.email,
      phone_number: retailer.phone_number,
      status: retailer.status as 'Approved' | 'Pending' | 'Rejected',
      address_1: retailer.address_1,
      address_2: retailer.address_2 || '',
      retailer_city: retailer.retailer_city,
      retailer_postcode: retailer.retailer_postcode,
      country: retailer.country,
      registration_channel: retailer.registration_channel as 'Website' | 'POS' | 'Manual',
      email_marketing: retailer.email_marketing as 'Subscribed' | 'Unsubscribed',
      total_order_count: retailer.total_order_count || 0,
      total_tax: Number(retailer.total_tax) || 0,
      total_spent: Number(retailer.total_spent) || 0,
      salesperson: retailer.salesperson,
      assigned_products: retailer.retailer_products?.map(rp => rp.products?.id).filter(Boolean) || []
    })) || [];
  }

  async getOrders(): Promise<LegacyOrder[]> {
    // Get current user role and salesperson name for filtering
    const userRole = await this.getCurrentUserRole();
    const salespersonName = await this.getCurrentUserSalespersonName();
    
    let query = supabase
      .from('orders')
      .select('*');
    
    // Apply role-based filtering
    if (userRole === 'salesperson' && salespersonName) {
      query = query.eq('salesperson', salespersonName);
    }
    // For admin and manager roles, no additional filtering is needed (RLS handles this)
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error in getOrders:', error, { table: 'orders' });
      throw error;
    }
    
    return data?.map(order => ({
      id: order.id,
      order_number: order.order_number,
      retailer_id: order.retailer_id || '',
      retailer_name: order.retailer_name,
      order_date: order.order_date || new Date().toISOString().split('T')[0],
      total_amount: Number(order.total_amount),
      tax_amount: Number(order.tax_amount),
      quantity: order.quantity,
      status: order.status as 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled',
      payment_status: order.payment_status as 'Pending' | 'Paid' | 'Failed' | 'Refunded',
      shipping_address: order.shipping_address || '',
      salesperson: order.salesperson,
      product_id: order.product_id || '',
      product_name: order.product_name || '',
      flavour: order.flavour || '',
      unit_price: order.unit_price
    })) || [];
  }

  async getSalespersons(): Promise<LegacySalesperson[]> {
    const { data, error } = await supabase
      .from('salespersons')
      .select('*');
    
    if (error) {
      console.error('Supabase error in getSalespersons:', error, { table: 'salespersons' });
      throw error;
    }
    
    return data?.map(salesperson => ({
      id: salesperson.id,
      name: salesperson.name,
      email: salesperson.email,
      phone: salesperson.phone || '',
      date_created: salesperson.date_created || new Date().toISOString().split('T')[0],
      total_revenue: Number(salesperson.total_revenue) || 0
    })) || [];
  }

  async addRetailer(retailerData: Omit<LegacyRetailer, 'id'>): Promise<void> {
    // Insert the retailer first
    const { data: retailer, error } = await supabase
      .from('retailers')
      .insert({
        date_created: retailerData.date_created,
        reg_company_name: retailerData.reg_company_name,
        store_name: retailerData.store_name,
        contact_person: retailerData.contact_person,
        sector: retailerData.sector,
        email: retailerData.email,
        phone_number: retailerData.phone_number,
        status: retailerData.status,
        address_1: retailerData.address_1,
        address_2: retailerData.address_2,
        retailer_city: retailerData.retailer_city,
        retailer_postcode: retailerData.retailer_postcode,
        country: retailerData.country,
        registration_channel: retailerData.registration_channel,
        email_marketing: retailerData.email_marketing,
        total_order_count: retailerData.total_order_count,
        total_tax: retailerData.total_tax,
        total_spent: retailerData.total_spent,
        salesperson: retailerData.salesperson
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error in addRetailer:', error, { table: 'retailers' });
      throw error;
    }

    // Handle assigned_products if provided
    if (retailerData.assigned_products && retailerData.assigned_products.length > 0 && retailer) {
      const productAssociations = retailerData.assigned_products.map(productId => ({
        retailer_id: retailer.id,
        product_id: productId
      }));
      
      const { error: productError } = await supabase
        .from('retailer_products')
        .insert(productAssociations);
      
      if (productError) {
        console.error('Error inserting product associations:', productError);
        // Don't throw here as the retailer was already created
      }
    }
    
    this.dispatchEvent();
  }

  async addOrder(orderData: Omit<LegacyOrder, 'id'>): Promise<void> {
    // Insert the order
    const { error } = await supabase
      .from('orders')
      .insert({
        order_number: orderData.order_number,
        retailer_id: orderData.retailer_id || null,
        retailer_name: orderData.retailer_name,
        order_date: orderData.order_date,
        total_amount: orderData.total_amount,
        tax_amount: orderData.tax_amount,
        quantity: orderData.quantity,
        status: orderData.status,
        payment_status: orderData.payment_status,
        shipping_address: orderData.shipping_address,
        salesperson: orderData.salesperson,
        product_id: orderData.product_id || null,
        product_name: orderData.product_name,
        flavour: orderData.flavour,
        unit_price: orderData.unit_price
      });
    
    if (error) {
      console.error('Supabase error in addOrder:', error, { table: 'orders' });
      throw error;
    }
    
    // Update salesperson revenue
    await this.updateSalespersonRevenue(orderData.salesperson, orderData.total_amount, 'add');
    
    // Update retailer totals if retailer_id exists
    if (orderData.retailer_id) {
      await this.updateRetailerTotals(orderData.retailer_id, orderData.total_amount, orderData.tax_amount, 'add');
    }
    
    this.dispatchEvent();
  }

  async addSalesperson(salespersonData: Omit<LegacySalesperson, 'id' | 'date_created'>): Promise<void> {
    const { error } = await supabase
      .from('salespersons')
      .insert({
        name: salespersonData.name,
        email: salespersonData.email,
        phone: salespersonData.phone
      });
    
    if (error) throw error;
    this.dispatchEvent();
  }

  async updateRetailer(id: string, updates: Partial<LegacyRetailer>): Promise<boolean> {
    try {
      // Extract assigned_products from updates
      const { assigned_products, ...retailerUpdates } = updates;
      
      // Update the retailer table
      const { error: retailerError } = await supabase
        .from('retailers')
        .update(retailerUpdates)
        .eq('id', id);
      
      if (retailerError) {
        console.error('Error updating retailer:', retailerError);
        return false;
      }
      
      // Handle assigned_products if provided
      if (assigned_products !== undefined) {
        // First, delete all existing product associations
        const { error: deleteError } = await supabase
          .from('retailer_products')
          .delete()
          .eq('retailer_id', id);
        
        if (deleteError) {
          console.error('Error deleting existing product associations:', deleteError);
          return false;
        }
        
        // Then insert new product associations
        if (assigned_products.length > 0) {
          const productAssociations = assigned_products.map(productId => ({
            retailer_id: id,
            product_id: productId
          }));
          
          const { error: insertError } = await supabase
            .from('retailer_products')
            .insert(productAssociations);
          
          if (insertError) {
            console.error('Error inserting product associations:', insertError);
            return false;
          }
        }
      }
      
      this.dispatchEvent();
      return true;
    } catch (error) {
      console.error('Error in updateRetailer:', error);
      return false;
    }
  }

  async updateOrder(id: string, updates: Partial<LegacyOrder>): Promise<boolean> {
    // Get the current order to calculate differences
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current order:', fetchError);
      return false;
    }
    
    // Update the order
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating order:', error);
      return false;
    }
    
    // Calculate revenue differences
    const oldAmount = currentOrder.total_amount || 0;
    const newAmount = updates.total_amount || oldAmount;
    const oldSalesperson = currentOrder.salesperson;
    const newSalesperson = updates.salesperson || oldSalesperson;
    const oldRetailerId = currentOrder.retailer_id;
    const newRetailerId = updates.retailer_id || oldRetailerId;
    const oldTax = currentOrder.tax_amount || 0;
    const newTax = updates.tax_amount || oldTax;
    
    // Update salesperson revenue
    if (oldSalesperson !== newSalesperson) {
      // Remove from old salesperson
      await this.updateSalespersonRevenue(oldSalesperson, oldAmount, 'subtract');
      // Add to new salesperson
      await this.updateSalespersonRevenue(newSalesperson, newAmount, 'add');
    } else if (oldAmount !== newAmount) {
      // Update existing salesperson with difference
      const difference = newAmount - oldAmount;
      await this.updateSalespersonRevenue(newSalesperson, difference, 'add');
    }
    
    // Update retailer totals
    if (oldRetailerId !== newRetailerId) {
      // Remove from old retailer
      if (oldRetailerId) {
        await this.updateRetailerTotals(oldRetailerId, oldAmount, oldTax, 'subtract');
      }
      // Add to new retailer
      if (newRetailerId) {
        await this.updateRetailerTotals(newRetailerId, newAmount, newTax, 'add');
      }
    } else if (oldAmount !== newAmount || oldTax !== newTax) {
      // Update existing retailer with differences
      if (newRetailerId) {
        const amountDifference = newAmount - oldAmount;
        const taxDifference = newTax - oldTax;
        await this.updateRetailerTotals(newRetailerId, amountDifference, taxDifference, 'add');
      }
    }
    
    this.dispatchEvent();
    return true;
  }

  async deleteRetailer(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('retailers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting retailer:', error);
      return false;
    }
    
    this.dispatchEvent();
    return true;
  }

  async deleteOrder(id: string): Promise<boolean> {
    // Get the order details before deletion
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching order for deletion:', fetchError);
      return false;
    }
    
    // Delete the order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting order:', error);
      return false;
    }
    
    // Update salesperson revenue (subtract)
    await this.updateSalespersonRevenue(order.salesperson, order.total_amount, 'subtract');
    
    // Update retailer totals (subtract)
    if (order.retailer_id) {
      await this.updateRetailerTotals(order.retailer_id, order.total_amount, order.tax_amount, 'subtract');
    }
    
    this.dispatchEvent();
    return true;
  }

  async deleteAllData(): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await supabase.from('retailer_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('retailers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('salespersons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    this.dispatchEvent();
  }

  async deleteAllProducts(): Promise<void> {
    // Delete retailer_products first due to foreign key constraints
    await supabase.from('retailer_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    this.dispatchEvent();
  }

  async deleteAllRetailers(): Promise<void> {
    // Delete retailer_products and orders first due to foreign key constraints
    await supabase.from('retailer_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('retailers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    this.dispatchEvent();
  }

  async deleteAllOrders(): Promise<void> {
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    this.dispatchEvent();
  }

  async deleteAllSalespersons(): Promise<void> {
    await supabase.from('salespersons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    this.dispatchEvent();
  }

  async exportToCSV(type: 'retailers' | 'orders' | 'products'): Promise<string> {
    try {
      let data: any[] = [];
      
      if (type === 'retailers') {
        data = await this.getRetailers();
      } else if (type === 'orders') {
        data = await this.getOrders();
      } else if (type === 'products') {
        data = await this.getProducts();
      }
      
      if (data.length === 0) {
        return 'No data to export';
      }
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export ${type} data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProducts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name),
        product_types(name)
      `)
      .order('product_name');
    
    if (error) {
      console.error('Supabase error in getProducts:', error, { table: 'products' });
      throw error;
    }
    
    return data?.map(product => ({
      id: product.id,
      product_name: product.product_name,
      product_type: product.product_types?.name || product.product_type,
      category: product.product_categories?.name || product.category,
      flavour: product.flavour,
      nicotine_strength: product.nicotine_strength,
      price: Number(product.price) || 0,
      created_at: product.created_at,
      updated_at: product.updated_at
    })) || [];
  }

  async importFromCSV(
    file: File, 
    type: 'retailers' | 'orders' | 'products',
    onProgress?: (currentRow: number, success: number, duplicates: number, errors: string[]) => void
  ): Promise<{ success: number; duplicates: number; errors: string[] }> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);
      
      let success = 0;
      let duplicates = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const rowNumber = i + 2; // +2 because we start from line 2 (after header)
        
        try {
          // Parse CSV row (handle quoted values)
          const values = this.parseCSVRow(line);
          
          if (values.length !== headers.length) {
            errors.push(`Row ${rowNumber}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
            continue;
          }
          
          // Create data object
          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          if (type === 'retailers') {
            await this.importRetailer(rowData, rowNumber, errors);
            success++;
          } else if (type === 'orders') {
            await this.importOrder(rowData, rowNumber, errors);
            success++;
          } else if (type === 'products') {
            await this.importProduct(rowData, rowNumber, errors);
            success++;
          }
          
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Call progress callback if provided
        if (onProgress) {
          onProgress(i + 1, success, duplicates, errors);
        }
      }
      
      return { success, duplicates, errors };
      
    } catch (error) {
      console.error('CSV import error:', error);
      throw new Error(`Failed to import ${type} data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseCSVRow(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last value
    values.push(current.trim());
    
    return values;
  }

  // Helper function to convert date formats
  private convertDateFormat(dateString: string): string {
    if (!dateString || dateString.trim() === '') {
      return new Date().toISOString().split('T')[0];
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // If in MM/DD/YYYY format, convert to YYYY-MM-DD
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    
    // If can't parse, return today's date
    console.warn(`Could not parse date format: ${dateString}, using today's date`);
    return new Date().toISOString().split('T')[0];
  }

  private async importRetailer(rowData: any, rowNumber: number, errors: string[]): Promise<void> {
    try {
      // Map new header names to expected field names
      const mappedData = {
        reg_company_name: rowData['Retailer Name'] || rowData['reg_company_name'],
        store_name: rowData['Store Name'] || rowData['store_name'],
        contact_person: rowData['Contact Person'] || rowData['contact_person'],
        email: rowData['Email'] || rowData['email'],
        phone_number: rowData['Phone Number'] || rowData['phone_number'],
        sector: rowData['Sector'] || rowData['sector'],
        status: rowData['Status'] || rowData['status'],
        address_1: rowData['Address Line 1'] || rowData['address_1'],
        address_2: rowData['Address Line 2'] || rowData['address_2'],
        retailer_city: rowData['City'] || rowData['retailer_city'],
        retailer_postcode: rowData['Postcode'] || rowData['retailer_postcode'],
        country: rowData['Country'] || rowData['country'],
        registration_channel: rowData['Registration Channel'] || rowData['registration_channel'],
        email_marketing: rowData['Email Marketing'] || rowData['email_marketing'],
        salesperson: rowData['Salesperson Name'] || rowData['salesperson'],
        total_order_count: rowData['Total Order Count'] || rowData['total_order_count'],
        total_tax: rowData['Total Tax'] || rowData['total_tax'],
        total_spent: rowData['Total Spent'] || rowData['total_spent'],
        date_created: this.convertDateFormat(rowData['Date Created'] || rowData['date_created'])
      };

      // Check for required fields
      const requiredFields = ['reg_company_name', 'contact_person', 'email', 'phone_number'];
      for (const field of requiredFields) {
        if (!mappedData[field] || mappedData[field].trim() === '') {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Check for duplicate email
      const { data: existing } = await supabase
        .from('retailers')
        .select('id')
        .eq('email', mappedData.email)
        .single();
      
      if (existing) {
        throw new Error(`Retailer with email ${mappedData.email} already exists`);
      }

      // Validate salesperson if provided
      let validatedSalesperson = '';
      if (mappedData.salesperson && mappedData.salesperson.trim() !== '') {
        const salespersonName = mappedData.salesperson.trim();
        
        // Check in legacy salespersons table
        const { data: legacySalesperson } = await supabase
          .from('salespersons')
          .select('name')
          .eq('name', salespersonName)
          .single();
        
        // Check in profiles table for users with salesperson role
        const { data: userSalesperson } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', salespersonName)
          .eq('role', 'salesperson')
          .eq('status', 'active')
          .single();
        
        if (legacySalesperson) {
          validatedSalesperson = legacySalesperson.name;
        } else if (userSalesperson) {
          validatedSalesperson = userSalesperson.username;
        } else {
          throw new Error(`Salesperson "${salespersonName}" not found. Please ensure the salesperson exists in the system.`);
        }
      }
      
      // Prepare retailer data
      const retailerData = {
        date_created: this.convertDateFormat(mappedData.date_created),
        reg_company_name: mappedData.reg_company_name,
        store_name: mappedData.store_name || mappedData.reg_company_name, // Use company name as store name if not provided
        contact_person: mappedData.contact_person,
        sector: (mappedData.sector as 'Vape Shop' | 'Convenience Store' | 'Not Provided') || 'Not Provided',
        email: mappedData.email,
        phone_number: mappedData.phone_number,
        status: (mappedData.status as 'Approved' | 'Pending' | 'Rejected') || 'Pending',
        address_1: mappedData.address_1 || '',
        address_2: mappedData.address_2 || '',
        retailer_city: mappedData.retailer_city || '',
        retailer_postcode: mappedData.retailer_postcode || '',
        country: mappedData.country || 'UK',
        registration_channel: (mappedData.registration_channel as 'Website' | 'POS' | 'Manual') || 'Manual',
        email_marketing: (mappedData.email_marketing as 'Subscribed' | 'Unsubscribed') || 'Unsubscribed',
        total_order_count: parseInt(mappedData.total_order_count) || 0,
        total_tax: parseFloat(mappedData.total_tax) || 0,
        total_spent: parseFloat(mappedData.total_spent) || 0,
        salesperson: validatedSalesperson
      };
      
      const { error } = await supabase
        .from('retailers')
        .insert(retailerData);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
    } catch (error) {
      errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async importOrder(rowData: any, rowNumber: number, errors: string[]): Promise<void> {
    try {
      // Check for required fields
      const requiredFields = ['order_number', 'retailer_name', 'total_amount', 'quantity', 'salesperson'];
      for (const field of requiredFields) {
        if (!rowData[field] || rowData[field].trim() === '') {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Check for duplicate order number
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', rowData.order_number)
        .single();
      
      if (existing) {
        throw new Error(`Order with number ${rowData.order_number} already exists`);
      }
      
      // Prepare order data
      const orderData = {
        order_number: rowData.order_number,
        retailer_id: rowData.retailer_id || null,
        retailer_name: rowData.retailer_name,
        order_date: this.convertDateFormat(rowData.order_date || new Date().toISOString().split('T')[0]),
        total_amount: parseFloat(rowData.total_amount) || 0,
        tax_amount: parseFloat(rowData.tax_amount) || 0,
        quantity: parseInt(rowData.quantity) || 0,
        status: (rowData.status as 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled') || 'Pending',
        payment_status: (rowData.payment_status as 'Pending' | 'Paid' | 'Failed' | 'Refunded') || 'Pending',
        shipping_address: rowData.shipping_address || '',
        salesperson: rowData.salesperson,
        product_id: rowData.product_id || null,
        product_name: rowData.product_name || '',
        flavour: rowData.flavour || '',
        unit_price: parseFloat(rowData.unit_price) || 0
      };
      
      const { error } = await supabase
        .from('orders')
        .insert(orderData);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
    } catch (error) {
      errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private dispatchEvent(): void {
    window.dispatchEvent(new Event('dataChanged'));
  }

  // Helper method to update salesperson revenue
  private async updateSalespersonRevenue(salespersonName: string, amount: number, operation: 'add' | 'subtract'): Promise<void> {
    try {
      const { data: salesperson, error: fetchError } = await supabase
        .from('salespersons')
        .select('total_revenue')
        .eq('name', salespersonName)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching salesperson ${salespersonName}:`, fetchError);
        return;
      }
      
      const currentRevenue = salesperson?.total_revenue || 0;
      const newRevenue = operation === 'add' ? currentRevenue + amount : currentRevenue - amount;
      
      const { error: updateError } = await supabase
        .from('salespersons')
        .update({ total_revenue: Math.max(0, newRevenue) }) // Ensure revenue doesn't go negative
        .eq('name', salespersonName);
      
      if (updateError) {
        console.error(`Error updating salesperson ${salespersonName} revenue:`, updateError);
      }
    } catch (error) {
      console.error(`Error in updateSalespersonRevenue for ${salespersonName}:`, error);
    }
  }

  // Helper method to update retailer totals
  private async updateRetailerTotals(retailerId: string, amount: number, tax: number, operation: 'add' | 'subtract'): Promise<void> {
    try {
      const { data: retailer, error: fetchError } = await supabase
        .from('retailers')
        .select('total_spent, total_order_count, total_tax')
        .eq('id', retailerId)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching retailer ${retailerId}:`, fetchError);
        return;
      }
      
      const currentSpent = retailer?.total_spent || 0;
      const currentCount = retailer?.total_order_count || 0;
      const currentTax = retailer?.total_tax || 0;
      
      const newSpent = operation === 'add' ? currentSpent + amount : currentSpent - amount;
      const newCount = operation === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);
      const newTax = operation === 'add' ? currentTax + tax : currentTax - tax;
      
      const { error: updateError } = await supabase
        .from('retailers')
        .update({
          total_spent: Math.max(0, newSpent),
          total_order_count: Math.max(0, newCount),
          total_tax: Math.max(0, newTax)
        })
        .eq('id', retailerId);
      
      if (updateError) {
        console.error(`Error updating retailer ${retailerId} totals:`, updateError);
      }
    } catch (error) {
      console.error(`Error in updateRetailerTotals for ${retailerId}:`, error);
    }
  }

  async getAvailableSalespersonNames(): Promise<string[]> {
    try {
      // Get legacy salespersons
      const { data: legacySalespersons } = await supabase
        .from('salespersons')
        .select('name');
      
      // Get active user salespersons
      const { data: userSalespersons } = await supabase
        .from('profiles')
        .select('username')
        .eq('role', 'salesperson')
        .eq('status', 'active');
      
      const names: string[] = [];
      
      // Add legacy salesperson names
      if (legacySalespersons) {
        names.push(...legacySalespersons.map(sp => sp.name));
      }
      
      // Add user salesperson usernames
      if (userSalespersons) {
        names.push(...userSalespersons.map(up => up.username));
      }
      
      return [...new Set(names)]; // Remove duplicates
    } catch (error) {
      console.error('Error fetching salesperson names:', error);
      return [];
    }
  }

  async getAvailableCategories(): Promise<string[]> {
    try {
      const { data: categories } = await supabase
        .from('product_categories')
        .select('name')
        .eq('is_active', true)
        .order('name');
      
      return categories?.map(cat => cat.name) || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getAvailableTypes(): Promise<string[]> {
    try {
      const { data: types } = await supabase
        .from('product_types')
        .select('name')
        .eq('is_active', true)
        .order('name');
      
      return types?.map(type => type.name) || [];
    } catch (error) {
      console.error('Error fetching types:', error);
      return [];
    }
  }

  private async importProduct(rowData: any, rowNumber: number, errors: string[]): Promise<void> {
    try {
      // Map new header names to expected field names
      const mappedData = {
        product_name: rowData['Product Name'] || rowData['product_name'],
        product_type: rowData['Product Type'] || rowData['product_type'],
        category: rowData['Category'] || rowData['category'],
        flavour: rowData['Flavour'] || rowData['flavour'],
        nicotine_strength: rowData['Nicotine Strength'] || rowData['nicotine_strength'],
        price: rowData['Price'] || rowData['price']
      };

      // Check for required fields
      const requiredFields = ['product_name', 'product_type', 'category', 'flavour', 'price'];
      for (const field of requiredFields) {
        if (!mappedData[field] || mappedData[field].trim() === '') {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Check for duplicate product (same name and flavour)
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('product_name', mappedData.product_name)
        .eq('flavour', mappedData.flavour)
        .single();
      
      if (existing) {
        throw new Error(`Product "${mappedData.product_name} - ${mappedData.flavour}" already exists`);
      }

      // Validate category
      let categoryId: string | null = null;
      if (mappedData.category && mappedData.category.trim() !== '') {
        const { data: category } = await supabase
          .from('product_categories')
          .select('id')
          .eq('name', mappedData.category.trim())
          .eq('is_active', true)
          .single();
        
        if (category) {
          categoryId = category.id;
        } else {
          throw new Error(`Category "${mappedData.category}" not found or not active`);
        }
      }
      
      // Validate product type
      let typeId: string | null = null;
      if (mappedData.product_type && mappedData.product_type.trim() !== '') {
        const { data: type } = await supabase
          .from('product_types')
          .select('id')
          .eq('name', mappedData.product_type.trim())
          .eq('is_active', true)
          .single();
        
        if (type) {
          typeId = type.id;
        } else {
          throw new Error(`Product type "${mappedData.product_type}" not found or not active`);
        }
      }
      
      // Prepare product data
      const productData = {
        product_name: mappedData.product_name.trim(),
        product_type: mappedData.product_type.trim(),
        category: mappedData.category.trim(),
        flavour: mappedData.flavour.trim(),
        nicotine_strength: mappedData.nicotine_strength?.trim() || null,
        price: parseFloat(mappedData.price) || 0,
        category_id: categoryId,
        type_id: typeId
      };
      
      const { error } = await supabase
        .from('products')
        .insert(productData);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
    } catch (error) {
      errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getProductsForOrder() {
    return supabaseProductService.getProductsForOrder();
  }

  // Method to recalculate all revenue from orders
  async recalculateRevenue(): Promise<void> {
    try {
      // Use a direct SQL query instead of RPC to avoid TypeScript issues
      const { error } = await supabase
        .from('salespersons')
        .update({ total_revenue: 0 });
      
      if (error) {
        console.error('Error resetting revenue:', error);
        throw error;
      }

      // Get all orders and calculate revenue manually
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('salesperson, total_amount');

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Group orders by salesperson and calculate totals
      const revenueBySalesperson: { [key: string]: number } = {};
      orders?.forEach(order => {
        const salesperson = order.salesperson || 'Not assigned';
        revenueBySalesperson[salesperson] = (revenueBySalesperson[salesperson] || 0) + (order.total_amount || 0);
      });

      // Update each salesperson's revenue
      for (const [salesperson, revenue] of Object.entries(revenueBySalesperson)) {
        const { error: updateError } = await supabase
          .from('salespersons')
          .update({ total_revenue: revenue })
          .eq('name', salesperson);

        if (updateError) {
          console.error(`Error updating ${salesperson} revenue:`, updateError);
        }
      }
      
      console.log('Revenue recalculation completed successfully');
      this.dispatchEvent();
    } catch (error) {
      console.error('Failed to recalculate revenue:', error);
      throw error;
    }
  }

  // Method to validate revenue consistency
  async validateRevenueConsistency(): Promise<any[]> {
    try {
      // Get all salespersons with their stored revenue
      const { data: salespersons, error: salespersonsError } = await supabase
        .from('salespersons')
        .select('name, total_revenue');

      if (salespersonsError) {
        console.error('Error fetching salespersons:', salespersonsError);
        throw salespersonsError;
      }

      // Get all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('salesperson, total_amount');

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Calculate revenue from orders for each salesperson
      const calculatedRevenue: { [key: string]: number } = {};
      orders?.forEach(order => {
        const salesperson = order.salesperson || 'Not assigned';
        calculatedRevenue[salesperson] = (calculatedRevenue[salesperson] || 0) + (order.total_amount || 0);
      });

      // Compare stored vs calculated revenue
      const inconsistencies: any[] = [];
      salespersons?.forEach(salesperson => {
        const calculated = calculatedRevenue[salesperson.name] || 0;
        const stored = salesperson.total_revenue || 0;
        const difference = Math.abs(calculated - stored);
        
        if (difference > 0.01) { // Allow for small floating point differences
          inconsistencies.push({
            entity_type: 'salesperson',
            entity_name: salesperson.name,
            calculated_revenue: calculated,
            stored_revenue: stored,
            difference: difference
          });
        }
      });

      return inconsistencies;
    } catch (error) {
      console.error('Failed to validate revenue consistency:', error);
      throw error;
    }
  }

  // Method to create sample data for testing revenue calculation
  async createSampleDataForTesting(): Promise<void> {
    try {
      // Create a sample salesperson
      const { data: salesperson, error: salespersonError } = await supabase
        .from('salespersons')
        .insert({
          name: 'Test Salesperson',
          email: 'test@example.com',
          phone: '+1234567890'
        })
        .select()
        .single();

      if (salespersonError && !salespersonError.message.includes('duplicate')) {
        console.error('Error creating sample salesperson:', salespersonError);
        throw salespersonError;
      }

      // Create a sample retailer
      const { data: retailer, error: retailerError } = await supabase
        .from('retailers')
        .insert({
          reg_company_name: 'Test Retailer Ltd',
          store_name: 'Test Store',
          contact_person: 'John Doe',
          email: 'john@testretailer.com',
          phone_number: '+1234567890',
          address_1: '123 Test Street',
          retailer_city: 'Test City',
          retailer_postcode: 'TE1 1ST',
          salesperson: 'Test Salesperson'
        })
        .select()
        .single();

      if (retailerError && !retailerError.message.includes('duplicate')) {
        console.error('Error creating sample retailer:', retailerError);
        throw retailerError;
      }

      // Create a sample product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          product_name: 'Test Product',
          product_type: 'E-liquid',
          category: 'Nicotine',
          flavour: 'Test Flavour',
          price: 10.00
        })
        .select()
        .single();

      if (productError && !productError.message.includes('duplicate')) {
        console.error('Error creating sample product:', productError);
        throw productError;
      }

      // Create sample orders
      const sampleOrders = [
        {
          order_number: 'TEST-ORD-001',
          retailer_id: retailer?.id,
          retailer_name: 'Test Retailer Ltd',
          total_amount: 100.00,
          tax_amount: 10.00,
          quantity: 10,
          salesperson: 'Test Salesperson',
          product_id: product?.id,
          product_name: 'Test Product',
          flavour: 'Test Flavour',
          unit_price: 10.00
        },
        {
          order_number: 'TEST-ORD-002',
          retailer_id: retailer?.id,
          retailer_name: 'Test Retailer Ltd',
          total_amount: 250.00,
          tax_amount: 25.00,
          quantity: 25,
          salesperson: 'Test Salesperson',
          product_id: product?.id,
          product_name: 'Test Product',
          flavour: 'Test Flavour',
          unit_price: 10.00
        }
      ];

      for (const orderData of sampleOrders) {
        const { error: orderError } = await supabase
          .from('orders')
          .insert(orderData);

        if (orderError && !orderError.message.includes('duplicate')) {
          console.error('Error creating sample order:', orderError);
          throw orderError;
        }
      }

      console.log('Sample data created successfully for testing');
      this.dispatchEvent();
    } catch (error) {
      console.error('Failed to create sample data:', error);
      throw error;
    }
  }

  // Method to delete test data
  async deleteTestData(): Promise<void> {
    try {
      // Delete test orders first (due to foreign key constraints)
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .or('order_number.eq.TEST-ORD-001,order_number.eq.TEST-ORD-002');

      if (ordersError) {
        console.error('Error deleting test orders:', ordersError);
        throw ordersError;
      }

      // Delete test retailer
      const { error: retailerError } = await supabase
        .from('retailers')
        .delete()
        .eq('reg_company_name', 'Test Retailer Ltd');

      if (retailerError) {
        console.error('Error deleting test retailer:', retailerError);
        throw retailerError;
      }

      // Delete test product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('product_name', 'Test Product');

      if (productError) {
        console.error('Error deleting test product:', productError);
        throw productError;
      }

      // Delete test salesperson
      const { error: salespersonError } = await supabase
        .from('salespersons')
        .delete()
        .eq('name', 'Test Salesperson');

      if (salespersonError) {
        console.error('Error deleting test salesperson:', salespersonError);
        throw salespersonError;
      }

      console.log('Test data deleted successfully');
      this.dispatchEvent();
    } catch (error) {
      console.error('Failed to delete test data:', error);
      throw error;
    }
  }
}

export const supabaseDataService = new SupabaseDataService();
