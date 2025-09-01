import { supabase } from '@/integrations/supabase/client';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  active: string;
  inactive: string;
}

export interface CompanyBranding {
  logoUrl: string;
  companyName: string;
}

class ThemeService {
  private static readonly THEME_COLORS_KEY = 'app-theme-colors';
  private static readonly BRANDING_STORAGE_KEY = 'company-branding';

  static readonly PREDEFINED_PALETTES: { id: string; name: string; description: string; colors: ThemeColors; preview: string }[] = [
    {
      id: 'default',
      name: 'Jungle Green',
      description: 'Professional green theme with neon accents',
      colors: {
        primary: '#228B22',
        secondary: '#f1f5f9',
        accent: '#39FF14',
        active: '#22c55e',
        inactive: '#ef4444'
      },
      preview: 'linear-gradient(135deg, #228B22 0%, #39FF14 100%)'
    },
    {
      id: 'ocean',
      name: 'Ocean Blue',
      description: 'Calming blue theme with cyan accents',
      colors: {
        primary: '#0ea5e9',
        secondary: '#f0f9ff',
        accent: '#06b6d4',
        active: '#3b82f6',
        inactive: '#ef4444'
      },
      preview: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
    },
    {
      id: 'sunset',
      name: 'Sunset Orange',
      description: 'Warm orange theme with coral accents',
      colors: {
        primary: '#f97316',
        secondary: '#fff7ed',
        accent: '#fb923c',
        active: '#ea580c',
        inactive: '#ef4444'
      },
      preview: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
    },
    {
      id: 'forest',
      name: 'Forest Green',
      description: 'Natural green theme with emerald accents',
      colors: {
        primary: '#16a34a',
        secondary: '#f0fdf4',
        accent: '#22c55e',
        active: '#15803d',
        inactive: '#ef4444'
      },
      preview: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
    },
    {
      id: 'purple',
      name: 'Royal Purple',
      description: 'Elegant purple theme with violet accents',
      colors: {
        primary: '#9333ea',
        secondary: '#faf5ff',
        accent: '#a855f7',
        active: '#7c3aed',
        inactive: '#ef4444'
      },
      preview: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)'
    },
    {
      id: 'rose',
      name: 'Rose Pink',
      description: 'Modern pink theme with rose accents',
      colors: {
        primary: '#e11d48',
        secondary: '#fff1f2',
        accent: '#f43f5e',
        active: '#be123c',
        inactive: '#ef4444'
      },
      preview: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)'
    }
  ];

  // ===== THEME MANAGEMENT =====
  static getTheme(): 'light' | 'dark' | 'system' {
    if (typeof window === 'undefined') return 'system';
    // Always use system theme if not persisted in DB
    return 'system';
  }

  static setTheme(theme: 'light' | 'dark' | 'system'): void {
    if (typeof window === 'undefined') return;
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  static getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // ===== COLOR MANAGEMENT =====
  static async getThemeColors(): Promise<ThemeColors> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', this.THEME_COLORS_KEY)
        .maybeSingle();
      if (error || !data?.value) {
        return this.PREDEFINED_PALETTES[0].colors;
      }
      return data.value as unknown as ThemeColors;
    } catch {
      return this.PREDEFINED_PALETTES[0].colors;
    }
  }

  static async setThemeColors(colors: ThemeColors): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User must be authenticated to update theme colors');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profileError || profile?.role !== 'admin') throw new Error('User must have admin role to update theme colors');
      await supabase
        .from('admin_settings')
        .upsert({
          key: this.THEME_COLORS_KEY,
          value: colors as unknown as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      this.applyThemeColors(colors);
      window.dispatchEvent(new CustomEvent('themeColorsChanged', { detail: { colors } }));
    } catch (error) {
      throw error;
    }
  }

  static applyThemeColors(colors: ThemeColors): void {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-active', colors.active);
    root.style.setProperty('--theme-inactive', colors.inactive);
    
    // Convert primary color to HSL for ring variable
    const primaryHsl = this.hexToHsl(colors.primary);
    root.style.setProperty('--theme-primary-hsl', primaryHsl);
  }

  // ===== BRANDING MANAGEMENT =====
  static async getCompanyBrandingAsync(): Promise<CompanyBranding> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', this.BRANDING_STORAGE_KEY)
        .maybeSingle();
      if (error || !data?.value) {
        return { logoUrl: '', companyName: 'Retailer Management System' };
      }
      return data.value as unknown as CompanyBranding;
    } catch {
      return { logoUrl: '', companyName: 'Retailer Management System' };
    }
  }

  static getCompanyBranding(): CompanyBranding {
    // Synchronous version that returns default branding
    // This is used by components that need immediate access
    return { logoUrl: '', companyName: 'Retailer Management System' };
  }

  static async setCompanyBranding(branding: CompanyBranding): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('User must be authenticated to update branding');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profileError || profile?.role !== 'admin') throw new Error('User must have admin role to update branding');
      await supabase
        .from('admin_settings')
        .upsert({
          key: this.BRANDING_STORAGE_KEY,
          value: branding as unknown as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      window.dispatchEvent(new CustomEvent('brandingChanged', { detail: { branding } }));
    } catch (error) {
      throw error;
    }
  }

  // ===== PALETTE MANAGEMENT =====
  static async applyPalette(paletteId: string): Promise<void> {
    try {
      const palette = this.PREDEFINED_PALETTES.find(p => p.id === paletteId);
      if (!palette) {
        throw new Error(`Palette with id '${paletteId}' not found`);
      }
      
      await this.setThemeColors(palette.colors);
      console.log(`Applied palette: ${palette.name}`);
    } catch (error) {
      console.error('Error applying palette:', error);
      throw error;
    }
  }

  // ===== INITIALIZATION METHODS =====
  static async initialize(): Promise<void> {
    try {
      // Set the default theme
      this.setTheme('system');
      
      // Get theme colors from database or use default
      const colors = await this.getThemeColors();
      this.applyThemeColors(colors);
      
      console.log('Theme initialized successfully');
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      // Fallback to default colors
      this.applyThemeColors(this.PREDEFINED_PALETTES[0].colors);
    }
  }

  static async forceInitializeDefaultColors(): Promise<void> {
    try {
      // Apply default colors without database interaction
      const defaultColors = this.PREDEFINED_PALETTES[0].colors;
      this.applyThemeColors(defaultColors);
      
      // Set system theme
      this.setTheme('system');
      
      console.log('Default theme colors initialized successfully');
    } catch (error) {
      console.error('Failed to initialize default colors:', error);
    }
  }

  // ===== UTILITY METHODS =====
  private static hexToHsl(hex: string): string {
    // Remove the # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    
    // Convert to degrees and percentages
    const hue = Math.round(h * 360);
    const saturation = Math.round(s * 100);
    const lightness = Math.round(l * 100);
    
    return `${hue} ${saturation}% ${lightness}%`;
  }
}

export default ThemeService;

