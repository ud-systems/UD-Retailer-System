// Essential interfaces for the application
export interface Retailer {
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

export interface Order {
  id: string;
  retailer_id: string;
  retailer_name: string;
  order_date: string;
  order_number: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  shipping_address: string;
  salesperson: string;
}

export interface OrderItem {
  id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Google Sheets integration configuration
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  retailersRange: string;
  ordersRange: string;
  salespersonsRange: string;
}

export const defaultGoogleSheetsConfig: GoogleSheetsConfig = {
  spreadsheetId: '',
  apiKey: '',
  retailersRange: 'Retailers!A:T',
  ordersRange: 'Orders!A:M',
  salespersonsRange: 'Salespersons!A:D'
};

// Admin configuration interface
export interface AdminConfig {
  googleSheets: GoogleSheetsConfig;
  mapboxToken: string;
  companyName: string;
  adminEmail: string;
  defaultCurrency: string;
  timezone: string;
}

export const requiredAdminFields = [
  {
    category: 'Google Sheets Integration',
    fields: [
      { name: 'spreadsheetId', label: 'Google Sheets ID', type: 'text', required: true, description: 'Found in your Google Sheet URL' },
      { name: 'apiKey', label: 'Google Sheets API Key', type: 'password', required: true, description: 'Create in Google Cloud Console' },
      { name: 'retailersRange', label: 'Retailers Sheet Range', type: 'text', required: true, default: 'Retailers!A:T' },
      { name: 'ordersRange', label: 'Orders Sheet Range', type: 'text', required: true, default: 'Orders!A:M' },
      { name: 'salespersonsRange', label: 'Salespersons Sheet Range', type: 'text', required: true, default: 'Salespersons!A:D' }
    ]
  },
  {
    category: 'Map Integration',
    fields: [
      { name: 'mapboxToken', label: 'Mapbox Public Token', type: 'password', required: true, description: 'Get from mapbox.com' }
    ]
  },
  {
    category: 'Company Settings',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'adminEmail', label: 'Admin Email', type: 'email', required: true },
      { name: 'defaultCurrency', label: 'Default Currency', type: 'select', options: ['USD', 'EUR', 'GBP'], required: true },
      { name: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'EST', 'PST', 'GMT'], required: true }
    ]
  }
];

// Statistical functions that work with Supabase data services
import { dataService } from '../services/dataService';

export const getRetailerStats = async () => {
  const retailers = await dataService.getRetailers();
  const approved = retailers.filter(r => r.status === 'Approved').length;
  const pending = retailers.filter(r => r.status === 'Pending').length;
  const rejected = retailers.filter(r => r.status === 'Rejected').length;
  
  return {
    total: retailers.length,
    approved,
    pending,
    rejected,
    growth: Math.floor(Math.random() * 20) + 5 // Placeholder growth calculation
  };
};

export const getRevenueByMonth = async () => {
  const orders = await dataService.getOrders();
  const monthlyRevenue: { [key: string]: number } = {};
  
  orders.forEach(order => {
    const month = new Date(order.order_date).toLocaleString('default', { month: 'short' });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.total_amount;
  });
  
  return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue
  }));
};

export const getSalespersonStats = async () => {
  const salespersons = await dataService.getSalespersons();
  return {
    total: salespersons.length,
    active: salespersons.length,
    topPerformer: salespersons[0]?.name || 'N/A'
  };
};

export const getSectorDistribution = async () => {
  const retailers = await dataService.getRetailers();
  const distribution: { [key: string]: number } = {};
  
  retailers.forEach(retailer => {
    distribution[retailer.sector] = (distribution[retailer.sector] || 0) + 1;
  });
  
  return Object.entries(distribution).map(([sector, count]) => ({
    sector,
    count,
    percentage: Math.round((count / retailers.length) * 100)
  }));
};

export const getRegistrationChannelStats = async () => {
  const retailers = await dataService.getRetailers();
  const channels: { [key: string]: number } = {};
  
  retailers.forEach(retailer => {
    channels[retailer.registration_channel] = (channels[retailer.registration_channel] || 0) + 1;
  });
  
  return Object.entries(channels).map(([channel, count]) => ({
    channel,
    count
  }));
};

export const getEmailMarketingStats = async () => {
  const retailers = await dataService.getRetailers();
  const subscribed = retailers.filter(r => r.email_marketing === 'Subscribed').length;
  const unsubscribed = retailers.filter(r => r.email_marketing === 'Unsubscribed').length;
  
  return {
    subscribed,
    unsubscribed,
    total: retailers.length,
    subscriptionRate: Math.round((subscribed / retailers.length) * 100)
  };
};

export const getTopCities = async () => {
  const retailers = await dataService.getRetailers();
  const cityCount: { [key: string]: number } = {};
  
  retailers.forEach(retailer => {
    cityCount[retailer.retailer_city] = (cityCount[retailer.retailer_city] || 0) + 1;
  });
  
  return Object.entries(cityCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));
};

export const getCityRetailers = async (cityName: string) => {
  const retailers = await dataService.getRetailers();
  return retailers.filter(retailer => retailer.retailer_city === cityName);
};

export const getCitySectorDistribution = async (cityName: string) => {
  const cityRetailers = await getCityRetailers(cityName);
  const distribution: { [key: string]: number } = {};
  
  cityRetailers.forEach(retailer => {
    distribution[retailer.sector] = (distribution[retailer.sector] || 0) + 1;
  });
  
  return Object.entries(distribution).map(([sector, count]) => ({
    sector,
    count,
    percentage: Math.round((count / cityRetailers.length) * 100)
  }));
};
