import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '../components/DashboardHeader';
import Navigation from '../components/Navigation';
import CityManagement from '../components/CityManagement';
import CategoryManagement from '../components/CategoryManagement';
import TypeManagement from '../components/TypeManagement';
import ThemeCustomizer from '../components/ThemeCustomizer';
import GoogleSheetsConfig from '../components/GoogleSheetsConfig';
import { ErrorLogsViewer } from '../components/ErrorLogsViewer';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user, hasRole } = useAuth();

  // Define tabs based on user role
  const getTabsConfig = () => {
    if (hasRole('admin')) {
      return [
        { value: 'cities', label: 'Cities' },
        { value: 'categories', label: 'Categories' },
        { value: 'types', label: 'Types' },
        { value: 'theme', label: 'Theme' },
        { value: 'sheets', label: 'Sheets' },
        { value: 'logs', label: 'Logs' },
        { value: 'about', label: 'About' },
      ];
    } else if (hasRole('manager')) {
      return [
        { value: 'cities', label: 'Cities' },
        { value: 'categories', label: 'Categories' },
        { value: 'types', label: 'Types' },
        { value: 'theme', label: 'Theme' },
        { value: 'sheets', label: 'Sheets' },
        { value: 'logs', label: 'Logs' },
        { value: 'about', label: 'About' },
      ];
    } else if (hasRole('salesperson')) {
      return [
        { value: 'cities', label: 'Cities' },
        { value: 'categories', label: 'Categories' },
        { value: 'types', label: 'Types' },
        { value: 'about', label: 'About' },
      ];
    }
    return [];
  };

  const tabsConfig = getTabsConfig();
  const defaultTab = tabsConfig.length > 0 ? tabsConfig[0].value : 'cities';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <Navigation />
      
      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6 lg:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {hasRole('admin') && 'Configure system preferences and manage integrations'}
            {hasRole('manager') && 'Configure system preferences and manage integrations'}
            {hasRole('salesperson') && 'View system information and configurations'}
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 h-auto">
            {tabsConfig.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
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

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="theme">
              <ThemeCustomizer />
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="sheets">
              <GoogleSheetsConfig />
            </TabsContent>
          )}

          {(hasRole('admin') || hasRole('manager')) && (
            <TabsContent value="logs">
              <ErrorLogsViewer />
            </TabsContent>
          )}

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
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Role: {user?.role}</h3>
                  <p className="text-sm">
                    {hasRole('admin') && 'You have full administrative access to all system features and data.'}
                    {hasRole('manager') && 'You have managerial access to manage retailers, products, orders, and salespersons.'}
                    {hasRole('salesperson') && 'You have access to view and manage your assigned retailers and orders.'}
                    {hasRole('viewer') && 'You have read-only access to view system data.'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings; 