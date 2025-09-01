import { dataService } from './dataService';
import { productService } from './productService';
import { adminService } from './adminService';

interface BackupData {
  timestamp: Date;
  version: string;
  retailers: any[];
  orders: any[];
  salespersons: any[];
  products: any[];
  settings: any;
}

class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';

  async createBackup(): Promise<BackupData> {
    try {
      const [retailers, orders, salespersons, products, settings] = await Promise.all([
        dataService.getRetailers(),
        dataService.getOrders(),
        dataService.getSalespersons(),
        productService.getProducts(),
        adminService.getSettings()
      ]);

      const backup: BackupData = {
        timestamp: new Date(),
        version: this.BACKUP_VERSION,
        retailers,
        orders,
        salespersons,
        products,
        settings
      };

      // Save backup metadata to admin settings
      await adminService.updateSetting('lastBackup', {
        timestamp: backup.timestamp.toISOString(),
        version: backup.version,
        recordCounts: {
          retailers: retailers.length,
          orders: orders.length,
          salespersons: salespersons.length,
          products: products.length
        }
      });

      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  async exportBackupToJSON(backup: BackupData): Promise<string> {
    return JSON.stringify(backup, null, 2);
  }

  async exportBackupToCSV(backup: BackupData): Promise<{ [key: string]: string }> {
    const csvFiles: { [key: string]: string } = {};

    // Export retailers
    if (backup.retailers.length > 0) {
      const headers = Object.keys(backup.retailers[0]).join(',');
      const rows = backup.retailers.map(retailer => 
        Object.values(retailer).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      csvFiles.retailers = [headers, ...rows].join('\n');
    }

    // Export orders
    if (backup.orders.length > 0) {
      const headers = Object.keys(backup.orders[0]).join(',');
      const rows = backup.orders.map(order => 
        Object.values(order).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      csvFiles.orders = [headers, ...rows].join('\n');
    }

    // Export salespersons
    if (backup.salespersons.length > 0) {
      const headers = Object.keys(backup.salespersons[0]).join(',');
      const rows = backup.salespersons.map(salesperson => 
        Object.values(salesperson).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      csvFiles.salespersons = [headers, ...rows].join('\n');
    }

    // Export products
    if (backup.products.length > 0) {
      const headers = Object.keys(backup.products[0]).join(',');
      const rows = backup.products.map(product => 
        Object.values(product).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      csvFiles.products = [headers, ...rows].join('\n');
    }

    return csvFiles;
  }

  async restoreFromBackup(backup: BackupData): Promise<void> {
    try {
      // Clear existing data
      await dataService.deleteAllData();

      // Restore retailers
      for (const retailer of backup.retailers) {
        const { id, ...retailerData } = retailer;
        await dataService.addRetailer(retailerData);
      }

      // Restore salespersons
      for (const salesperson of backup.salespersons) {
        const { id, date_created, ...salespersonData } = salesperson;
        await dataService.addSalesperson(salespersonData);
      }

      // Restore products
      for (const product of backup.products) {
        const { id, created_at, updated_at, ...productData } = product;
        await productService.addProduct(productData);
      }

      // Restore orders
      for (const order of backup.orders) {
        const { id, ...orderData } = order;
        await dataService.addOrder(orderData);
      }

      // Restore settings
      for (const [key, value] of Object.entries(backup.settings)) {
        await adminService.updateSetting(key, value);
      }

      // Update restore metadata
      await adminService.updateSetting('lastRestore', {
        timestamp: new Date().toISOString(),
        version: backup.version,
        recordCounts: {
          retailers: backup.retailers.length,
          orders: backup.orders.length,
          salespersons: backup.salespersons.length,
          products: backup.products.length
        }
      });

    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async validateBackup(backup: BackupData): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check version compatibility
    if (backup.version !== this.BACKUP_VERSION) {
      errors.push(`Backup version ${backup.version} is not compatible with current version ${this.BACKUP_VERSION}`);
    }

    // Check required fields
    if (!backup.timestamp) {
      errors.push('Backup timestamp is missing');
    }

    if (!Array.isArray(backup.retailers)) {
      errors.push('Retailers data is invalid');
    }

    if (!Array.isArray(backup.orders)) {
      errors.push('Orders data is invalid');
    }

    if (!Array.isArray(backup.salespersons)) {
      errors.push('Salespersons data is invalid');
    }

    if (!Array.isArray(backup.products)) {
      errors.push('Products data is invalid');
    }

    // Check data integrity
    if (backup.retailers.length > 0) {
      const requiredFields = ['reg_company_name', 'store_name', 'contact_person', 'email', 'phone_number'];
      for (let i = 0; i < backup.retailers.length; i++) {
        const retailer = backup.retailers[i];
        for (const field of requiredFields) {
          if (!retailer[field]) {
            errors.push(`Retailer ${i + 1} is missing required field: ${field}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async getBackupHistory(): Promise<any[]> {
    try {
      const settings = await adminService.getSettings();
      const history = [];
      
      if (settings.lastBackup) {
        history.push({
          type: 'backup',
          ...settings.lastBackup
        });
      }
      
      if (settings.lastRestore) {
        history.push({
          type: 'restore',
          ...settings.lastRestore
        });
      }
      
      return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting backup history:', error);
      return [];
    }
  }

  async downloadBackup(backup: BackupData, format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = await this.exportBackupToJSON(backup);
        filename = `backup-${backup.timestamp.toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        const csvFiles = await this.exportBackupToCSV(backup);
        content = Object.entries(csvFiles)
          .map(([name, data]) => `=== ${name.toUpperCase()} ===\n${data}`)
          .join('\n\n');
        filename = `backup-${backup.timestamp.toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup');
    }
  }
}

export const backupService = new BackupService();
