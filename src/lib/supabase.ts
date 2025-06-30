import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rcumodwgxwbrzjeuxtpg.supabase.co'; // Replace with your real Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdW1vZHdneHdicnpqZXV4dHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg4ODQsImV4cCI6MjA2NDczNDg4NH0.wXtIfeiXi2yOBzTf3K1J9dKtreX62qFqC8W4e8AUnfI'; // Replace with your real Supabase anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
