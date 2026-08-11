import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * A second, throwaway Supabase client used only to call auth.signUp() on
 * behalf of another person (e.g. an admin creating a staff account).
 *
 * supabase-js persists whatever session a client receives to localStorage
 * and updates that client's in-memory session — if we called signUp() on
 * the normal `supabase` client, it would silently switch the browser from
 * the admin's session to the brand-new staff account's session. This
 * client has persistSession/autoRefreshToken off and its own storage key,
 * so it never touches localStorage and never affects the main app's auth
 * state. Its result is used once (the new user's id) and then discarded.
 */
export const supabaseAux = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sahan-aux-auth-unused',
  },
})
