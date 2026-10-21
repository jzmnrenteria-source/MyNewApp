import { AREAS } from './data.js'
import { QUESTIONS } from './questions.js'

// Points available per factor (they add up to 100).
export const WEIGHTS = { goal: 35, budget: 25, priority: 20, schedule: 10, distance: 10 }

// Straight-line distance in miles between two neighborhood centers.
export function milesBetween(a, b) {
  const A = AREAS[a]
  const B = AREAS[b]
  if (!A || !B) return null
  const rad = Math.PI / 180
  const dLat = (B.lat - A.lat) * rad
  const dLng = (B.lng - A.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(A.lat * rad) * Math.cos(B.lat * rad) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

function distanceFit(miles) {
  if (miles <= 2) return 1
  if (miles <= 5) return 0.6
  if (miles <= 8) return 0.3
  return 0
}

// Score one gym against a set of answers. Returns { score, reasons, cautions, miles }.
export function scoreGym(gym, answers, homeArea) {
  const reasons = []
  const cautions = []
  let score = 0

  // Goal
  if (gym.goals.primary.includes(answers.goal)) {
    score += WEIGHTS.goal
    reasons.push('Built for your goal')
  } else if (gym.goals.secondary.includes(answers.goal)) {
    score += WEIGHTS.goal * 0.5
    reasons.push('Covers your goal')
  } else {
    cautions.push('Not focused on your goal')
  }

  // Budget: price level vs the budget level picked
  const budget = Number(answers.budget)
  if (gym.tier <= budget) {
    score += WEIGHTS.budget
    reasons.push('Within budget (est.)')
  } else if (gym.tier === budget + 1) {
    score += WEIGHTS.budget * 0.3
    cautions.push('Likely a bit over budget')
  } else {
    cautions.push('Likely over budget')
  }

  // Schedule: open-gym access fits any time; class studios depend on the timetable
  if (gym.access === 'open') {
    score += WEIGHTS.schedule
    reasons.push('Open-gym access')
  } else {
    score += WEIGHTS.schedule * (answers.when === 'varies' ? 0.4 : 0.6)
    if (answers.when === 'varies') cautions.push('Set class times')
  }

  // Distance
  const miles = milesBetween(homeArea, gym.area)
  const near = distanceFit(miles)
  score += WEIGHTS.distance * near

  // Priority
  const p = answers.priority
  let fit = 0
  if (p === 'price') fit = { 1: 1, 2: 0.7, 3: 0.3, 4: 0 }[gym.tier]
  else if (p === 'location') fit = near
  else if (p === 'coaching') fit = gym.coached ? 1 : 0.2
  else if (p === 'amenities') fit = gym.recovery ? 1 : gym.tier >= 3 ? 0.4 : 0.1
  else if (p === 'community') fit = gym.community ? 1 : 0.2
  score += WEIGHTS.priority * fit
  if (fit >= 0.7) {
    reasons.push({
      price: 'Good value', location: 'Close by', coaching: 'Coaching included',
      amenities: 'Recovery amenities', community: 'Strong community',
    }[p])
  }

  return { score: Math.round(score), reasons, cautions, miles }
}

// Rank all gyms, best first. Ties go to the closer gym.
export function rankGyms(gyms, answers, homeArea) {
  return gyms
    .map((gym) => ({ gym, ...scoreGym(gym, answers, homeArea) }))
    .sort((a, b) => b.score - a.score || a.miles - b.miles)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

// Read answers from a URL query string; returns null unless every answer is valid.
export function parseAnswers(search) {
  const params = new URLSearchParams(search)
  const answers = {}
  for (const q of QUESTIONS) {
    const v = params.get(q.key)
    if (!q.options.some((o) => o.value === v)) return null
    answers[q.key] = v
  }
  const near = params.get('near')
  return { answers, near: AREAS[near] ? near : 'brickell' }
}

export function toQuery(answers, near) {
  return new URLSearchParams({ ...answers, near }).toString()
}
