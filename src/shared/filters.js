import { AREAS } from './data.js'
import { milesBetween, rankGyms } from './scoring.js'

export const FEATURES = [
  { value: 'open', label: 'Open-gym access', test: (g) => g.access === 'open' },
  { value: 'coached', label: 'Coaching included', test: (g) => g.coached },
  { value: 'recovery', label: 'Recovery amenities', test: (g) => g.recovery },
  { value: 'community', label: 'Class community', test: (g) => g.community },
]

export const DISTANCES = [
  { value: 0, label: 'Any distance' },
  { value: 2, label: 'Within 2 mi' },
  { value: 5, label: 'Within 5 mi' },
  { value: 8, label: 'Within 8 mi' },
]

export const PRICES = [
  { value: 0, label: 'Any price' },
  { value: 1, label: '$ · under $50' },
  { value: 2, label: '$$ · up to $100' },
  { value: 3, label: '$$$ · up to $200' },
]

export function defaultFilters(near = 'brickell') {
  return { maxTier: 0, near, maxMiles: 0, goals: [], features: [], area: null }
}

// Gyms that pass every filter. Goals match if any picked goal is a primary or secondary goal.
export function filterGyms(gyms, f) {
  return gyms.filter((g) => {
    if (f.maxTier && g.tier > f.maxTier) return false
    if (f.maxMiles && milesBetween(f.near, g.area) > f.maxMiles) return false
    if (f.area && g.area !== f.area) return false
    if (f.goals.length && !f.goals.some((goal) => g.goals.primary.includes(goal) || g.goals.secondary.includes(goal))) return false
    return f.features.every((v) => FEATURES.find((x) => x.value === v)?.test(g) ?? true)
  })
}

// Rank by the visitor's quiz answers when we have them, otherwise by distance.
export function sortGyms(gyms, near, quiz) {
  if (quiz?.answers) return rankGyms(gyms, quiz.answers, near)
  return gyms
    .map((gym) => ({ gym, miles: milesBetween(near, gym.area), score: null }))
    .sort((a, b) => a.miles - b.miles || a.gym.name.localeCompare(b.gym.name))
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

// One map marker per neighborhood, with how many of the filtered gyms are there.
export function areaCounts(gyms) {
  return Object.entries(AREAS).map(([key, a]) => ({
    key, ...a, count: gyms.filter((g) => g.area === key).length,
  }))
}

export function activeFilterCount(f) {
  return (f.maxTier ? 1 : 0) + (f.maxMiles ? 1 : 0) + (f.area ? 1 : 0) + f.goals.length + f.features.length
}
