import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AdminSetting = Database['public']['Tables']['admin_settings']['Row'];
type AdminSettingInsert = Database['public']['Tables']['admin_settings']['Insert'];

class SupabaseAdminService {
  async getSettings(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching admin settings:', error);
        return {};
      }

      const settings: Record<string, any> = {};
      data?.forEach((setting: AdminSetting) => {
        settings[setting.key] = setting.value;
      });

      return settings;
    } catch (error) {
      console.error('Error in getSettings:', error);
      return {};
    }
  }

  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ 
          key, 
          value,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating admin setting:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSetting:', error);
      return false;
    }
  }

  async deleteSetting(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .delete()
        .eq('key', key);

      if (error) {
        console.error('Error deleting admin setting:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSetting:', error);
      return false;
    }
  }
}

export const supabaseAdminService = new SupabaseAdminService();
