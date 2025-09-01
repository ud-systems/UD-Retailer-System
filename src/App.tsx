import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Retailers from "./pages/Retailers";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import RetailerProfile from "./pages/RetailerProfile";
import SalespersonList from "./pages/SalespersonList";
import SalespersonProfile from "./pages/SalespersonProfile";
import CityAnalytics from "./pages/CityAnalytics";
import Settings from "./pages/Settings";
import DataManagement from "./pages/DataManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import ThemeService from './services/themeService';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize theme on app start
    const initializeTheme = async () => {
      try {
        await ThemeService.initialize();
      } catch (error) {
        console.error('Failed to initialize theme, using fallback:', error);
        // Force initialize default colors as fallback
        await ThemeService.forceInitializeDefaultColors();
      }
    };

    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 w-full">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <Dashboard />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/retailers" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <Retailers />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/products" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <Products />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/retailer/:id" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <RetailerProfile />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <Orders />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/salespersons" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <SalespersonList />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/salesperson/:name" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <SalespersonProfile />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <CityAnalytics />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <Settings />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/data-management" element={
                  <ProtectedRoute requiredRole="admin">
                    <div className="page-transition">
                      <DataManagement />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/user-management" element={
                  <ProtectedRoute>
                    <div className="page-transition">
                      <UserManagement />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/404" element={
                  <div className="page-transition">
                    <NotFound />
                  </div>
                } />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </div>
            <Toaster />
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
