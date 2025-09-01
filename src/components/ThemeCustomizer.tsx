import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, Upload, Eye, Check, Sparkles, Building2, AlertCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThemeService, { ThemeColors, ColorPalette, CompanyBranding } from '../services/themeService';
import { supabase } from '../integrations/supabase/client';

const ThemeCustomizer = () => {
  const defaultTheme: ThemeColors = {
    primary: 'var(--theme-primary, #228B22)',
    secondary: 'var(--theme-secondary, #f1f5f9)',
    accent: 'var(--theme-accent, #39FF14)',
    active: 'var(--theme-active, #22c55e)',
    inactive: 'var(--theme-inactive, #ef4444)'
  };
  const [colors, setColors] = useState<ThemeColors>(defaultTheme);
  const [branding, setBranding] = useState<CompanyBranding>({ 
    logoUrl: '', 
    companyName: 'Retailer Management System' 
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Check user authentication and role
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (user && !authError) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            if (!profileError && profile) {
              setUserRole(profile.role);
              setIsAdmin(profile.role === 'admin');
            } else {
              console.warn('Could not fetch user profile, assuming admin for theme access:', profileError?.message);
              // Fallback: if we can't check the profile due to RLS, assume admin for theme access
              setUserRole('admin');
              setIsAdmin(true);
            }
          } catch (profileError) {
            console.warn('Profile check failed, assuming admin for theme access:', profileError);
            // Fallback: if we can't check the profile due to RLS, assume admin for theme access
            setUserRole('admin');
            setIsAdmin(true);
          }
        }

        const [themeColors, brandingData] = await Promise.all([
          ThemeService.getThemeColors(),
          ThemeService.getCompanyBrandingAsync()
        ]);
        
        setColors(themeColors);
        setBranding(brandingData);
      } catch (error) {
        console.error('Error loading theme data:', error);
        toast({
          title: "Error",
          description: "Failed to load theme settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleColorChange = async (colorType: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [colorType]: value };
    setColors(newColors);
    
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can update theme colors.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await ThemeService.setThemeColors(newColors);
      toast({
        title: "Color Updated",
        description: `${colorType.charAt(0).toUpperCase() + colorType.slice(1)} color has been updated.`,
      });
    } catch (error) {
      console.error('Error updating color:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update color.",
        variant: "destructive",
      });
    }
  };

  const handlePaletteSelect = async (palette: ColorPalette) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can apply theme palettes.",
        variant: "destructive",
      });
      return;
    }

    try {
      await ThemeService.applyPalette(palette.id);
      setColors(palette.colors);
      toast({
        title: "Palette Applied",
        description: `${palette.name} theme has been applied successfully.`,
      });
    } catch (error) {
      console.error('Error applying palette:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply palette.",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can update company branding.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG, JPG, or SVG file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const logoUrl = e.target?.result as string;
      const newBranding = { ...branding, logoUrl };
      setBranding(newBranding);
      
      try {
        await ThemeService.setCompanyBranding(newBranding);
        toast({
          title: "Logo Uploaded",
          description: "Company logo has been updated successfully.",
        });
      } catch (error) {
        console.error('Error updating logo:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update logo.",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCompanyNameChange = async (name: string) => {
    const newBranding = { ...branding, companyName: name };
    setBranding(newBranding);
    
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can update company branding.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await ThemeService.setCompanyBranding(newBranding);
    } catch (error) {
      console.error('Error updating company name:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update company name.",
        variant: "destructive",
      });
    }
  };

  const ColorPicker = ({ 
    label, 
    colorType, 
    value, 
    onChange 
  }: { 
    label: string; 
    colorType: keyof ThemeColors; 
    value: string; 
    onChange: (colorType: keyof ThemeColors, value: string) => void;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={`${colorType}-color`} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex space-x-2">
        <Input
          id={`${colorType}-color`}
          type="color"
          value={value}
          onChange={(e) => onChange(colorType, e.target.value)}
          className="w-16 h-10 p-1 rounded border-2 border-gray-200 hover:border-gray-300 transition-colors"
          disabled={!isAdmin}
        />
        <Input
          value={value}
          onChange={(e) => onChange(colorType, e.target.value)}
          placeholder={`#${colorType}`}
          className="flex-1"
          disabled={!isAdmin}
        />
      </div>
    </div>
  );

  const PaletteCard = ({ palette, isSelected }: { palette: ColorPalette; isSelected: boolean }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-300'
      } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
      onClick={() => isAdmin && handlePaletteSelect(palette)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div 
            className="w-full h-16 rounded-lg shadow-inner"
            style={{ background: palette.preview }}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{palette.name}</h4>
              {isSelected && <Check className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">{palette.description}</p>
            <div className="flex space-x-1">
              {Object.values(palette.colors).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Alert */}
      {!isAdmin && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>
                You need administrator privileges to modify theme settings. 
                Current role: <strong>{userRole || 'Unknown'}</strong>
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </TabsTrigger>
          <TabsTrigger value="palettes" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Palettes</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Branding</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Custom Colors</span>
                {!isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Read Only
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ColorPicker
                  label="Primary Color"
                  colorType="primary"
                  value={colors.primary}
                  onChange={handleColorChange}
                />
                <ColorPicker
                  label="Secondary Color"
                  colorType="secondary"
                  value={colors.secondary}
                  onChange={handleColorChange}
                />
                <ColorPicker
                  label="Accent Color"
                  colorType="accent"
                  value={colors.accent}
                  onChange={handleColorChange}
                />
                <ColorPicker
                  label="Active Color"
                  colorType="active"
                  value={colors.active}
                  onChange={handleColorChange}
                />
                <ColorPicker
                  label="Inactive Color"
                  colorType="inactive"
                  value={colors.inactive}
                  onChange={handleColorChange}
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h4 className="font-semibold mb-4 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Color Preview
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(colors).map(([key, color]) => (
                    <div key={key} className="text-center space-y-2">
                      <div 
                        className="w-full h-16 rounded-lg shadow-md" 
                        style={{ backgroundColor: color }}
                      />
                      <div className="text-xs font-medium capitalize">{key}</div>
                      <div className="text-xs text-muted-foreground font-mono">{color}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="palettes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Predefined Palettes</span>
                {!isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Read Only
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ThemeService.PREDEFINED_PALETTES.map((palette) => (
                  <PaletteCard
                    key={palette.id}
                    palette={palette}
                    isSelected={
                      palette.colors.primary === colors.primary &&
                      palette.colors.accent === colors.accent
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Company Branding</span>
                {!isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Read Only
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-name" className="text-sm font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="company-name"
                    value={branding.companyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    placeholder="Enter company name"
                    className="mt-1"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logo-upload" className="text-sm font-medium">
                      Company Logo
                    </Label>
                    <div className="mt-1 flex items-center space-x-4">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="flex-1"
                        disabled={!isAdmin}
                      />
                      <Badge variant="secondary" className="text-xs">
                        Max 2MB
                      </Badge>
                    </div>
                  </div>

                  {branding.logoUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Logo Preview</Label>
                      <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <img
                          src={branding.logoUrl}
                          alt="Company logo"
                          className="h-12 w-auto max-w-32 object-contain"
                        />
                        <div className="text-sm text-muted-foreground">
                          <div>Format: {logoFile?.type || 'Unknown'}</div>
                          <div>Size: {logoFile ? `${(logoFile.size / 1024).toFixed(1)}KB` : 'Unknown'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Logo Guidelines
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Supported formats: PNG, JPG, SVG</li>
                      <li>• Maximum file size: 2MB</li>
                      <li>• Recommended dimensions: 200x200px or larger</li>
                      <li>• SVG format recommended for best quality</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThemeCustomizer;
