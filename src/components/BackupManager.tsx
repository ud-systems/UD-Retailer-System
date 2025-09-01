import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Settings,
  Cloud,
  HardDrive,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { backupService } from '../services/backupService';
import { adminService } from '../services/adminService';

interface BackupLog {
  id: string;
  timestamp: string;
  type: 'backup' | 'restore';
  status: 'success' | 'error';
  message: string;
  recordCounts?: {
    retailers: number;
    orders: number;
    salespersons: number;
    products: number;
  };
}

const BackupManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [settings, setSettings] = useState({
    autoBackup: false,
    backupInterval: 24,
    retentionDays: 30
  });

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      // Load backup history from admin settings
      const backupHistory = await backupService.getBackupHistory();
      setLogs(backupHistory.map((item, index) => ({
        id: index.toString(),
        timestamp: item.timestamp,
        type: item.type,
        status: 'success',
        message: `${item.type} completed successfully`,
        recordCounts: item.recordCounts
      })));

      // Load backup settings from admin settings
      const adminSettings = await adminService.getSettings();
      if (adminSettings.backupSettings) {
        setSettings(adminSettings.backupSettings);
      }
    } catch (error) {
      console.error('Failed to load backup data:', error);
    }
  };

  const updateSettings = async (newSettings: typeof settings) => {
    try {
      await adminService.updateSetting('backupSettings', newSettings);
      setSettings(newSettings);
      toast({
        title: "Settings Updated",
        description: "Backup settings have been saved.",
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Error",
        description: "Failed to update backup settings.",
        variant: "destructive",
      });
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      const backup = await backupService.createBackup();
      
      const newLog: BackupLog = {
        id: Date.now().toString(),
        timestamp: backup.timestamp.toISOString(),
        type: 'backup',
        status: 'success',
        message: 'Backup created successfully',
        recordCounts: {
          retailers: backup.retailers.length,
          orders: backup.orders.length,
          salespersons: backup.salespersons.length,
          products: backup.products.length
        }
      };

      setLogs(prev => [newLog, ...prev]);
      
      toast({
        title: "Backup Created",
        description: `Successfully backed up ${backup.retailers.length} retailers, ${backup.orders.length} orders, ${backup.salespersons.length} salespersons, and ${backup.products.length} products.`,
      });

      // Download the backup
      await backupService.downloadBackup(backup, 'json');
      
    } catch (error) {
      console.error('Backup failed:', error);
      const errorLog: BackupLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'backup',
        status: 'error',
        message: error instanceof Error ? error.message : 'Backup failed'
      };
      setLogs(prev => [errorLog, ...prev]);
      
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      // Validate backup
      const validation = await backupService.validateBackup(backup);
      if (!validation.isValid) {
        throw new Error(`Invalid backup: ${validation.errors.join(', ')}`);
      }

      // Restore backup
      await backupService.restoreFromBackup(backup);
      
      const newLog: BackupLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'restore',
        status: 'success',
        message: 'Backup restored successfully',
        recordCounts: {
          retailers: backup.retailers.length,
          orders: backup.orders.length,
          salespersons: backup.salespersons.length,
          products: backup.products.length
        }
      };

      setLogs(prev => [newLog, ...prev]);
      
      toast({
        title: "Backup Restored",
        description: `Successfully restored ${backup.retailers.length} retailers, ${backup.orders.length} orders, ${backup.salespersons.length} salespersons, and ${backup.products.length} products.`,
      });
      
    } catch (error) {
      console.error('Restore failed:', error);
      const errorLog: BackupLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'restore',
        status: 'error',
        message: error instanceof Error ? error.message : 'Restore failed'
      };
      setLogs(prev => [errorLog, ...prev]);
      
      toast({
        title: "Restore Failed",
        description: "Failed to restore backup. Please check the file and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      restoreBackup(file);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast({
      title: "Logs Cleared",
      description: "Backup logs have been cleared.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Backup Manager</h2>
        <div className="flex gap-2">
          <Button
            onClick={createBackup}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Create Backup
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById('restore-file')?.click()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Restore Backup
          </Button>
          <input
            id="restore-file"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Backup Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto Backup</label>
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => updateSettings({ ...settings, autoBackup: e.target.checked })}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Backup Interval (hours)</label>
              <input
                type="number"
                value={settings.backupInterval}
                onChange={(e) => updateSettings({ ...settings, backupInterval: parseInt(e.target.value) || 24 })}
                className="w-20 px-2 py-1 border rounded"
                min="1"
                max="168"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Retention (days)</label>
              <input
                type="number"
                value={settings.retentionDays}
                onChange={(e) => updateSettings({ ...settings, retentionDays: parseInt(e.target.value) || 30 })}
                className="w-20 px-2 py-1 border rounded"
                min="1"
                max="365"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Backups</span>
                <span className="font-medium">{logs.filter(log => log.type === 'backup').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Backup</span>
                <span className="font-medium">
                  {logs.find(log => log.type === 'backup')?.timestamp 
                    ? new Date(logs.find(log => log.type === 'backup')!.timestamp).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">
                  {logs.length > 0 
                    ? `${Math.round((logs.filter(log => log.status === 'success').length / logs.length) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Backup Logs</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No backup logs found</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{log.message}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <Badge variant={log.type === 'backup' ? 'default' : 'secondary'}>
                          {log.type}
                        </Badge>
                        {log.recordCounts && (
                          <span>
                            {log.recordCounts.retailers} retailers, {log.recordCounts.orders} orders
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManager;
