import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  Store, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Database, 
  UserCog, 
  LogOut, 
  User,
  Package,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import UserProfileDialog from './UserProfileDialog';
import ThemeService from '../services/themeService';

const Navigation = () => {
  const { user, logout, isAdmin, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [branding, setBranding] = useState({ logoUrl: '', companyName: 'Retailer Management System' });

  useEffect(() => {
    const loadBranding = () => {
      try {
        const brandingData = ThemeService.getCompanyBranding();
        setBranding(brandingData);
      } catch (error) {
        console.error('Failed to load branding:', error);
      }
    };

    loadBranding();
  }, []);

  useEffect(() => {
    const handleBrandingChange = (event: CustomEvent) => {
      setBranding(event.detail);
    };

    window.addEventListener('brandingChanged', handleBrandingChange as EventListener);
    return () => {
      window.removeEventListener('brandingChanged', handleBrandingChange as EventListener);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'viewer', 'salesperson'] },
    { path: '/retailers', label: 'Retailers', icon: Store, roles: ['admin', 'manager', 'viewer', 'salesperson'] },
    { path: '/products', label: 'Products', icon: Package, roles: ['admin', 'manager', 'salesperson'] },
    { path: '/orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'manager', 'viewer', 'salesperson'] },
    { path: '/salespersons', label: 'Sales Team', icon: Users, roles: ['admin', 'manager'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'manager', 'salesperson'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'manager', 'salesperson'] },
    { path: '/data-management', label: 'Data Management', icon: Database, roles: ['admin'] },
    { path: '/user-management', label: 'User Management', icon: UserCog, roles: ['admin', 'manager'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.some(role => hasRole(role as any))
  );

  // Get bottom navigation items (most important ones)
  const bottomNavItems = filteredNavItems.slice(0, 5);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                {branding.logoUrl ? (
                  <img 
                    src={branding.logoUrl} 
                    alt="Company Logo" 
                    className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-8 h-8 bg-theme-primary rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                )}
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="flex items-center space-x-4 lg:space-x-6">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      isActive
                        ? 'bg-theme-primary text-white shadow-md transform scale-105'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-theme-primary dark:hover:text-theme-primary hover:shadow-sm'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Profile and Theme Toggle */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-gray-300 dark:border-gray-600 hover:border-theme-primary dark:hover:border-theme-primary transition-all duration-300 hover:scale-110">
                      <AvatarImage src={user.profilePicture} alt={user.username} />
                      <AvatarFallback className="bg-theme-primary text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 animate-fade-in" align="end" forceMount>
                  <div className="flex items-center justify-start space-x-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsProfileOpen(true)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <nav className="lg:hidden bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="px-4">
          <div className="flex justify-between items-center h-14">
            {/* Mobile Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                {branding.logoUrl ? (
                  <img 
                    src={branding.logoUrl} 
                    alt="Company Logo" 
                    className="h-6 w-auto transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-6 h-6 bg-theme-primary rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                )}
              </Link>
            </div>

            {/* Mobile Header Actions */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-10 w-10 p-0"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profilePicture} alt={user.username} />
                <AvatarFallback className="bg-theme-primary text-white font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-2">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-theme-primary text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsProfileOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
        <div className="flex justify-around">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-all duration-200 ${
                  isActive
                    ? 'text-theme-primary'
                    : 'text-gray-500 dark:text-gray-400 hover:text-theme-primary'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>



      <UserProfileDialog 
        open={isProfileOpen} 
        onOpenChange={setIsProfileOpen} 
      />
    </>
  );
};

export default Navigation;
