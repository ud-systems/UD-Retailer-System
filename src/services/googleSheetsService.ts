
import { adminService } from './adminService';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  retailersRange: string;
  ordersRange: string;
  salespersonsRange: string;
}

class GoogleSheetsService {
  private async getConfig(): Promise<GoogleSheetsConfig | null> {
    try {
      const settings = await adminService.getSettings();
      
      if (!settings.googleSheetsSpreadsheetId || !settings.googleSheetsApiKey) {
        return null;
      }

      return {
        spreadsheetId: settings.googleSheetsSpreadsheetId,
        apiKey: settings.googleSheetsApiKey,
        retailersRange: settings.googleSheetsRetailersRange || 'Retailers!A:T',
        ordersRange: settings.googleSheetsOrdersRange || 'Orders!A:M',
        salespersonsRange: settings.googleSheetsSpersonsRange || 'Salespersons!A:D'
      };
    } catch (error) {
      console.error('Failed to get Google Sheets config:', error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    const config = await this.getConfig();
    if (!config) return false;

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?key=${config.apiKey}`
      );
      return response.ok;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }

  async getRetailers(): Promise<any[]> {
    const config = await this.getConfig();
    if (!config) return [];

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.retailersRange}?key=${config.apiKey}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return this.parseSheetData(data.values || []);
    } catch (error) {
      console.error('Failed to fetch retailers from Google Sheets:', error);
      return [];
    }
  }

  async getOrders(): Promise<any[]> {
    const config = await this.getConfig();
    if (!config) return [];

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.ordersRange}?key=${config.apiKey}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return this.parseSheetData(data.values || []);
    } catch (error) {
      console.error('Failed to fetch orders from Google Sheets:', error);
      return [];
    }
  }

  async getSalespersons(): Promise<any[]> {
    const config = await this.getConfig();
    if (!config) return [];

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.salespersonsRange}?key=${config.apiKey}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return this.parseSheetData(data.values || []);
    } catch (error) {
      console.error('Failed to fetch salespersons from Google Sheets:', error);
      return [];
    }
  }

  private parseSheetData(values: any[][]): any[] {
    if (values.length < 2) return [];
    
    const headers = values[0];
    const rows = values.slice(1);
    
    return rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }

  async saveConfig(config: Partial<GoogleSheetsConfig>): Promise<void> {
    try {
      const updates = Object.entries(config).map(([key, value]) => 
        adminService.updateSetting(`googleSheets${key.charAt(0).toUpperCase() + key.slice(1)}`, value)
      );
      
      await Promise.all(updates);
    } catch (error) {
      console.error('Failed to save Google Sheets config:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
