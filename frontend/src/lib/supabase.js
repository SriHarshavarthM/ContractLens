import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function mapSupabaseUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const name = meta.name || user.email?.split('@')[0] || 'User';
  const role = meta.role || 'Contract Analyst';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'US';
  return {
    id: user.id,
    email: user.email || '',
    name,
    role,
    avatar_initials: initials,
    employee_id: meta.employee_id || '',
  };
}

export async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail({ email, password, name, role }) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}