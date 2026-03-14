import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gubcgidldzzhcjtzkhjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1YmNnaWRsZHp6aGNqdHpraGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzE1MDUsImV4cCI6MjA4ODkwNzUwNX0.h7Y5ic0gEP_b64tEsDRdAgsSTvQXC0uLDWcy_FSWGzI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
