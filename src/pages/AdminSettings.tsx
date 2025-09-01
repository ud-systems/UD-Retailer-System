import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import CityManagement from '../components/CityManagement';
import CategoryManagement from '../components/CategoryManagement';
import TypeManagement from '../components/TypeManagement';
import ThemeCustomizer from '../components/ThemeCustomizer';
import GoogleSheetsConfig from '../components/GoogleSheetsConfig';
import { ErrorLogsViewer } from '../components/ErrorLogsViewer';

const AdminSettings = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure system preferences and manage integrations</p>
        </div>

        <Tabs defaultValue="cities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="sheets">Sheets</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="cities">
            <CityManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="types">
            <TypeManagement />
          </TabsContent>

          <TabsContent value="theme">
            <ThemeCustomizer />
          </TabsContent>

          <TabsContent value="sheets">
            <GoogleSheetsConfig />
          </TabsContent>

          <TabsContent value="logs">
            <ErrorLogsViewer />
          </TabsContent>

          <TabsContent value="about">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">About the System</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400">
                <p>
                  This is a comprehensive Retailer Management System designed to help businesses manage their 
                  retailer relationships, track orders, and analyze performance data.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Features</h3>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>User Management & Authentication</li>
                      <li>Retailer Management</li>
                      <li>Product Catalog</li>
                      <li>Order Tracking</li>
                      <li>Analytics & Reporting</li>
                      <li>City Management</li>
                      <li>Category & Type Management</li>
                      <li>Theme Customization</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Technology Stack</h3>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>React + TypeScript</li>
                      <li>Tailwind CSS</li>
                      <li>Supabase Backend</li>
                      <li>Shadcn/ui Components</li>
                      <li>Vite Build Tool</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminSettings;
