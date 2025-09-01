// Admin client for operations that require service role key
// This should only be used for admin operations and should be kept secure
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tpdhcesneddslwauqyzu.supabase.co";

// For production, this should be stored securely and not in client-side code
// You can set this via environment variable: VITE_SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Only create admin client if service role key is available
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Helper function to check if admin client is available
export const hasAdminAccess = () => !!SUPABASE_SERVICE_ROLE_KEY; 