import { useState, useEffect, useCallback } from 'react';
import { googleSheetsService } from '../services/googleSheetsService';
import { dataService } from '../services/dataService';
import { adminService } from '../services/adminService';
import { useToast } from './use-toast';

export const useDataSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load last sync time from admin settings
    const loadLastSync = async () => {
      try {
        const settings = await adminService.getSettings();
        if (settings.lastSyncTime) {
          setLastSync(new Date(settings.lastSyncTime));
        }
        if (settings.googleSheetsConfig?.spreadsheetId) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to load last sync time:', error);
      }
    };

    loadLastSync();
  }, []);

  const testConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const connected = await googleSheetsService.testConnection();
      setIsConnected(connected);
      
      if (connected) {
        toast({
          title: "Connection Successful",
          description: "Google Sheets integration is working properly.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Please check your Google Sheets configuration.",
          variant: "destructive",
        });
      }
      
      return connected;
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Google Sheets.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const syncData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [retailers, orders, salespersons] = await Promise.all([
        googleSheetsService.getRetailers(),
        googleSheetsService.getOrders(),
        googleSheetsService.getSalespersons(),
      ]);

      // Save sync data using Supabase instead of localStorage
      const syncTime = new Date();
      await adminService.updateSetting('lastSyncTime', syncTime.toISOString());
      await adminService.updateSetting('syncedRetailersCount', retailers.length);
      await adminService.updateSetting('syncedOrdersCount', orders.length);
      await adminService.updateSetting('syncedSalespersonsCount', salespersons.length);
      
      setLastSync(syncTime);
      setIsConnected(true);
      
      toast({
        title: "Data Synced",
        description: `Successfully synced ${retailers.length} retailers, ${orders.length} orders, and ${salespersons.length} salespersons.`,
      });
      
      return { retailers, orders, salespersons };
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync data from Google Sheets.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Auto-sync every hour if connected
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(syncData, 60 * 60 * 1000); // 1 hour
      return () => clearInterval(interval);
    }
  }, [isConnected, syncData]);

  return {
    isLoading,
    lastSync,
    isConnected,
    testConnection,
    syncData,
  };
};
