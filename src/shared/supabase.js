import { createClient } from '@supabase/supabase-js'

// The URL and publishable key are public by design (they ship to every browser);
// row level security in the database decides what each visitor can read or change.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key) : null
