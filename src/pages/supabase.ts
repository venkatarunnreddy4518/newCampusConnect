import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://rpwxsnbmehetomeafmii.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd3hzbmJtZWhldG9tZWFmbWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzQzNjQsImV4cCI6MjA5MDIxMDM2NH0.V_WKyuOgp-Od05hJoLZUQiMbya-FNl1NjwuYXUNLv_k'

export const supabase = createClient(supabaseUrl, supabaseKey)