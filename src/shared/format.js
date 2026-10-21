import { AREAS, TIERS } from './data.js'
import { QUESTIONS } from './questions.js'

const GOAL_LABELS = Object.fromEntries(QUESTIONS[0].options.map((o) => [o.value, o.label]))

export const goalLabel = (g) => GOAL_LABELS[g] ?? g
export const areaLabel = (a) => AREAS[a]?.label ?? a
export const priceLabel = (tier) => `${TIERS[tier].symbol} · est. ${TIERS[tier].range}`
export const accessLabel = (gym) => (gym.access === 'open' ? 'Open-gym access' : 'Scheduled classes')

export function milesLabel(m) {
  if (m == null) return ''
  return m < 0.5 ? 'nearby' : `~${m.toFixed(1)} mi`
}

export function scoreClass(s) {
  return s >= 80 ? 'score-hi' : s >= 60 ? 'score-mid' : 'score-lo'
}

export const gymUrl = (id) => `/gym/?id=${encodeURIComponent(id)}`

// Opens a maps search for the gym in the visitor's maps app or browser.
export function directionsUrl(gym) {
  const where = gym.address ? `${gym.address}, Miami, FL` : `${areaLabel(gym.area)}, Miami, FL`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${gym.name}, ${where}`)}`
}
