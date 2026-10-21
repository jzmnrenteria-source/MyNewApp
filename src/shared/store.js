// Visitor state shared by every page: saved gyms (with notes), the compare list
// and the last quiz answers. Kept in this browser's localStorage; when the visitor
// is signed in, saved gyms and notes also sync to their account.
import { reactive, watch } from 'vue'
import { supabase } from './supabase.js'
import { auth } from './auth.js'

const KEY = 'fitquest-state'
export const MAX_COMPARE = 4
const isId = (id) => typeof id === 'string' && /^[a-z0-9-]{2,60}$/.test(id)

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      saved: Array.isArray(raw.saved)
        ? raw.saved.filter((s) => isId(s?.id)).map((s) => ({ id: s.id, note: String(s.note ?? '').slice(0, 500) }))
        : [],
      compare: Array.isArray(raw.compare) ? raw.compare.filter(isId).slice(0, MAX_COMPARE) : [],
      quiz: raw.quiz && typeof raw.quiz === 'object' ? raw.quiz : null,
    }
  } catch {
    return { saved: [], compare: [], quiz: null }
  }
}

export const state = reactive(load())

watch(state, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch { /* storage blocked: state lasts for this visit only */ }
  updateNavCounts()
}, { deep: true })

// Another tab changed the state: pick it up so counts and lists stay in sync.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) Object.assign(state, load())
})

export const isSaved = (id) => state.saved.some((s) => s.id === id)
export const inCompare = (id) => state.compare.includes(id)
export const compareFull = () => state.compare.length >= MAX_COMPARE

// ── Account sync ───────────────────────────────────────────────────────
const signedIn = () => !!(supabase && auth.user)
const noteTimers = {}

async function remote(op) {
  if (!signedIn()) return
  const { error } = await op(supabase.from('saved_gyms'))
  if (error) console.warn('Could not sync saved gyms:', error.message)
}

// On sign-in, merge this browser's shortlist with the account's, and save the result to both.
async function syncOnSignIn() {
  const { data, error } = await supabase.from('saved_gyms').select('gym_id, note').order('created_at')
  if (error) return
  const merged = new Map(data.map((r) => [r.gym_id, r.note]))
  const toUpload = []
  for (const s of state.saved) {
    if (!merged.has(s.id)) toUpload.push(s)
    else if (!merged.get(s.id) && s.note) toUpload.push(s)
    if (!merged.get(s.id)) merged.set(s.id, s.note)
  }
  if (toUpload.length) {
    await remote((t) => t.upsert(toUpload.map((s) => ({ gym_id: s.id, note: s.note }))))
  }
  state.saved = [...merged].map(([id, note]) => ({ id, note: note ?? '' }))
}

let lastUser = null
watch(() => auth.user?.id ?? null, (id) => {
  if (id && id !== lastUser) syncOnSignIn()
  // Signing out on a shared device shouldn't leave the account's shortlist behind.
  if (!id && lastUser) state.saved = []
  lastUser = id
})

export function toggleSaved(id) {
  const i = state.saved.findIndex((s) => s.id === id)
  if (i >= 0) {
    state.saved.splice(i, 1)
    remote((t) => t.delete().eq('gym_id', id))
  } else {
    state.saved.push({ id, note: '' })
    remote((t) => t.upsert({ gym_id: id, note: '' }))
  }
}

export function setNote(id, note) {
  const s = state.saved.find((s) => s.id === id)
  if (!s) return
  s.note = note.slice(0, 500)
  // Save notes to the account once typing pauses.
  clearTimeout(noteTimers[id])
  noteTimers[id] = setTimeout(() => remote((t) => t.upsert({ gym_id: id, note: s.note })), 600)
}

export function toggleCompare(id) {
  const i = state.compare.indexOf(id)
  if (i >= 0) state.compare.splice(i, 1)
  else if (!compareFull()) state.compare.push(id)
}

export function rememberQuiz(answers, near) {
  state.quiz = { answers: { ...answers }, near }
}

// The header is static HTML (so the theme switch works before Vue loads);
// fill in its Saved / Compare counts here.
export function updateNavCounts() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const n = state[el.dataset.count]?.length ?? 0
    el.textContent = n ? ` (${n})` : ''
  })
}
updateNavCounts()
