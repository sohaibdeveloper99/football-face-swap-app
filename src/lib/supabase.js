import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vxwtwerojlaccjqkjupe.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4d3R3ZXJvamxhY2NqcWtqdXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjA2MDYsImV4cCI6MjA3NjE5NjYwNn0.BbJXux6ojpG0N6x2E3XBdVzG_TBkHgGyNUs5Xg2R9D4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
