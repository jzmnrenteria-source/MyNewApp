// Visitor state shared by every page: saved gyms (with notes), the compare list
// and the last quiz answers. Kept in this browser's localStorage until Phase 4 adds accounts.
import { reactive, watch } from 'vue'
import { GYMS } from './data.js'

const KEY = 'fitquest-state'
export const MAX_COMPARE = 4
const known = new Set(GYMS.map((g) => g.id))

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      saved: Array.isArray(raw.saved) ? raw.saved.filter((s) => known.has(s?.id)) : [],
      compare: Array.isArray(raw.compare) ? raw.compare.filter((id) => known.has(id)).slice(0, MAX_COMPARE) : [],
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

export function toggleSaved(id) {
  const i = state.saved.findIndex((s) => s.id === id)
  if (i >= 0) state.saved.splice(i, 1)
  else state.saved.push({ id, note: '' })
}

export function toggleCompare(id) {
  const i = state.compare.indexOf(id)
  if (i >= 0) state.compare.splice(i, 1)
  else if (!compareFull()) state.compare.push(id)
}

export function setNote(id, note) {
  const s = state.saved.find((s) => s.id === id)
  if (s) s.note = note.slice(0, 500)
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
