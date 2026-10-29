import { createClient } from '@supabase/supabase-js';

// Publishable (public) values — safe in the browser; data is protected by RLS.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://bhdsltfpwzjnzcgpeyfn.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hCePSOLP4DW8d8aEL0UTqQ_MGvToCcO';

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
