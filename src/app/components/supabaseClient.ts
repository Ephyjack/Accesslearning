import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://sbhvpjqxjjwooyoppalb.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaHZwanF4amp3b295b3BwYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDEzOTMsImV4cCI6MjA4OTQxNzM5M30.1tDqRw1U-i8Bb2qe351ToqYn8lz9JjlH7bBPwBdsA_0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)