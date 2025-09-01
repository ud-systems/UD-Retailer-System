import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, TestTube, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataSync } from '../hooks/useDataSync';
import { adminService } from '../services/adminService';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  retailersRange: string;
  ordersRange: string;
  salespersonsRange: string;
}

const GoogleSheetsConfig = () => {
  const { toast } = useToast();
  const { testConnection, isLoading } = useDataSync();
  const [config, setConfig] = useState<GoogleSheetsConfig>({
    spreadsheetId: '',
    apiKey: '',
    retailersRange: 'Retailers!A:T',
    ordersRange: 'Orders!A:M',
    salespersonsRange: 'Salespersons!A:D'
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const settings = await adminService.getSettings();
      if (settings.googleSheetsConfig) {
        setConfig(settings.googleSheetsConfig);
      }
    } catch (error) {
      console.error('Failed to load Google Sheets config:', error);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      await adminService.updateSetting('googleSheetsConfig', config);
      toast({
        title: "Configuration Saved",
        description: "Google Sheets configuration has been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save Google Sheets configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const connected = await testConnection();
    if (connected) {
      toast({
        title: "Connection Successful",
        description: "Google Sheets integration is working properly.",
      });
    }
  };

  const handleInputChange = (field: keyof GoogleSheetsConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Google Sheets Configuration</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleTestConnection}
            disabled={isLoading || !config.spreadsheetId || !config.apiKey}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Test Connection
          </Button>
          <Button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheetId">Google Sheets ID</Label>
            <Input
              id="spreadsheetId"
              value={config.spreadsheetId}
              onChange={(e) => handleInputChange('spreadsheetId', e.target.value)}
              placeholder="Enter your Google Sheets ID"
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Found in your Google Sheet URL: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">Google Sheets API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="Enter your Google Sheets API Key"
                className="font-mono pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Create in Google Cloud Console under APIs & Services &gt; Credentials
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sheet Ranges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retailersRange">Retailers Sheet Range</Label>
            <Input
              id="retailersRange"
              value={config.retailersRange}
              onChange={(e) => handleInputChange('retailersRange', e.target.value)}
              placeholder="e.g., Retailers!A:T"
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Range for retailer data (e.g., Retailers!A:T for columns A to T)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordersRange">Orders Sheet Range</Label>
            <Input
              id="ordersRange"
              value={config.ordersRange}
              onChange={(e) => handleInputChange('ordersRange', e.target.value)}
              placeholder="e.g., Orders!A:M"
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Range for order data (e.g., Orders!A:M for columns A to M)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salespersonsRange">Salespersons Sheet Range</Label>
            <Input
              id="salespersonsRange"
              value={config.salespersonsRange}
              onChange={(e) => handleInputChange('salespersonsRange', e.target.value)}
              placeholder="e.g., Salespersons!A:D"
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Range for salesperson data (e.g., Salespersons!A:D for columns A to D)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Create a Google Sheet</h4>
            <p className="text-sm text-muted-foreground">
              Create a new Google Sheet with separate tabs for Retailers, Orders, and Salespersons.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Enable Google Sheets API</h4>
            <p className="text-sm text-muted-foreground">
              Go to Google Cloud Console, enable the Google Sheets API, and create an API key.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Share the Sheet</h4>
            <p className="text-sm text-muted-foreground">
              Make sure your Google Sheet is accessible with the API key (public or shared appropriately).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">4. Configure Ranges</h4>
            <p className="text-sm text-muted-foreground">
              Set the correct ranges for each sheet tab based on your data structure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleSheetsConfig;
