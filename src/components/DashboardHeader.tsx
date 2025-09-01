import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTimeBasedGreeting } from '../utils/greetingUtils';
import ThemeService, { CompanyBranding } from '../services/themeService';

const DashboardHeader = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [companyBranding, setCompanyBranding] = useState<CompanyBranding>({ 
    logoUrl: '', 
    companyName: 'Retailer Management System' 
  });

  useEffect(() => {
    if (user) {
      setGreeting(getTimeBasedGreeting(user.username));
    }
    
    // Load company branding
    const loadBranding = async () => {
      try {
        const branding = await ThemeService.getCompanyBrandingAsync();
        setCompanyBranding(branding);
      } catch (error) {
        console.error('Error loading company branding:', error);
      }
    };

    loadBranding();

    // Listen for branding changes
    const handleBrandingChange = (event: CustomEvent) => {
      setCompanyBranding(event.detail.branding);
    };

    window.addEventListener('brandingChanged', handleBrandingChange as EventListener);

    return () => {
      window.removeEventListener('brandingChanged', handleBrandingChange as EventListener);
    };
  }, [user]);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-6 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {companyBranding.logoUrl && (
            <img 
              src={companyBranding.logoUrl} 
              alt="Company Logo" 
              className="h-6 sm:h-8 w-auto object-contain"
            />
          )}
          <div className="flex flex-col">
            {companyBranding.companyName && (
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground">
                {companyBranding.companyName}
              </h2>
            )}
            {user && (
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{greeting}</h1>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
