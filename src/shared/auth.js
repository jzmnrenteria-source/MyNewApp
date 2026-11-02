// Sign-in with an emailed link or Google, and the signed-in visitor's profile.
import { reactive } from 'vue'
import { supabase } from './supabase.js'
import { avatarUrl, firstName } from './profile.js'

export { avatarUrl, displayName, firstName } from './profile.js'

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
  const pic = avatarUrl(auth.user)
  document.querySelectorAll('[data-auth-link]').forEach((el) => {
    el.textContent = auth.user ? firstName(auth.user) || 'Account' : 'Sign in'
    // Desktop nav link (the mobile tab bar has its own icon): show the profile photo beside it.
    const link = el.parentElement
    if (!link || link.querySelector('svg')) return
    let img = link.querySelector('.nav-avatar')
    if (!pic) return img?.remove()
    if (!img) {
      img = document.createElement('img')
      img.className = 'nav-avatar'
      img.alt = ''
      img.referrerPolicy = 'no-referrer'
      img.addEventListener('error', () => img.remove())
      link.prepend(img)
    }
    if (img.src !== pic) img.src = pic
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
  rememberNext(next)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/account/` },
  })
  if (error) throw error
}

// Send the visitor to Google; Supabase brings them back to the account page signed in.
export async function signInWithGoogle(next) {
  if (!supabase) throw new Error('Sign-in isn’t available right now.')
  rememberNext(next)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/account/` },
  })
  if (error) throw error
}

function rememberNext(next) {
  try {
    if (next && next.startsWith('/') && !next.startsWith('//')) localStorage.setItem(NEXT_KEY, next)
  } catch { /* storage blocked: return to the account page instead */ }
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
