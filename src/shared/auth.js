// Sign-in with an emailed link, and the signed-in visitor's profile.
import { reactive } from 'vue'
import { supabase } from './supabase.js'

export const auth = reactive({ ready: !supabase, user: null, profile: null })
const NEXT_KEY = 'fitquest-next'

async function loadProfile() {
  if (!auth.user) {
    auth.profile = null
    return
  }
  const { data } = await supabase.from('profiles').select('id, email, is_admin').eq('id', auth.user.id).maybeSingle()
  auth.profile = data ?? { id: auth.user.id, email: auth.user.email, is_admin: false }
}

function updateNav() {
  document.querySelectorAll('[data-auth-link]').forEach((el) => {
    el.textContent = auth.user ? 'Account' : 'Sign in'
  })
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    const changed = (session?.user?.id ?? null) !== (auth.user?.id ?? null)
    auth.user = session?.user ?? null
    updateNav()
    // Profile lookups can't run inside this callback (supabase-js deadlocks); defer them.
    if (changed || !auth.ready) {
      setTimeout(async () => {
        await loadProfile()
        auth.ready = true
      }, 0)
    }
  })
}
updateNav()

export function whenReady() {
  return new Promise((resolve) => {
    if (auth.ready) return resolve(auth)
    const t = setInterval(() => {
      if (auth.ready) {
        clearInterval(t)
        resolve(auth)
      }
    }, 50)
  })
}

// Send the sign-in link. `next` is where to return afterwards (same site only).
export async function sendSignInLink(email, next) {
  if (!supabase) throw new Error('Sign-in isn’t available right now.')
  try {
    if (next && next.startsWith('/') && !next.startsWith('//')) localStorage.setItem(NEXT_KEY, next)
  } catch { /* storage blocked: return to the account page instead */ }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/account/` },
  })
  if (error) throw error
}

// Where to go after the link brings the visitor back.
export function takeNext() {
  try {
    const next = localStorage.getItem(NEXT_KEY)
    localStorage.removeItem(NEXT_KEY)
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null
  } catch {
    return null
  }
}

export async function signOut() {
  await supabase?.auth.signOut()
}

export const signInUrl = (next = window.location.pathname + window.location.search) =>
  `/account/?next=${encodeURIComponent(next)}`
