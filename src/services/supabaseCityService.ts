
import { supabase } from '@/integrations/supabase/client';

interface City {
  id: string;
  name: string;
  country: string;
  created_by?: string;
  created_at: string;
}

class SupabaseCityService {
  async getCities(): Promise<City[]> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching cities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCities:', error);
      return [];
    }
  }

  async addCity(cityData: { name: string; country: string; created_by?: string }): Promise<City | null> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert(cityData)
        .select()
        .single();

      if (error) {
        console.error('Error adding city:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addCity:', error);
      return null;
    }
  }

  async updateCity(id: string, updates: Partial<City>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cities')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating city:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateCity:', error);
      return false;
    }
  }

  async deleteCity(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting city:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteCity:', error);
      return false;
    }
  }
}

export const supabaseCityService = new SupabaseCityService();
