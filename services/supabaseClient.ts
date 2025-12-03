
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kwodkdiockyazadgpqbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3b2RrZGlvY2t5YXphZGdwcWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDIxODYsImV4cCI6MjA4MDExODE4Nn0.CkKeUrPYEnjTXIVNBhETWdtgMnKqPkLsLl7Bmiywf7M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
