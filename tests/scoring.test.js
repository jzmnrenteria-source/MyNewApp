import { describe, expect, it } from 'vitest'
import { GYMS, AREAS } from '../src/shared/data.js'
import { QUESTIONS } from '../src/shared/questions.js'
import { WEIGHTS, milesBetween, parseAnswers, rankGyms, scoreGym, toQuery } from '../src/shared/scoring.js'

const base = { goal: 'strength', budget: '2', when: 'evening', priority: 'price' }

describe('data', () => {
  it('has unique ids and valid fields', () => {
    const goals = QUESTIONS[0].options.map((o) => o.value)
    expect(new Set(GYMS.map((g) => g.id)).size).toBe(GYMS.length)
    for (const g of GYMS) {
      expect(AREAS[g.area], g.id).toBeTruthy()
      expect([1, 2, 3, 4]).toContain(g.tier)
      expect(['open', 'classes']).toContain(g.access)
      for (const goal of [...g.goals.primary, ...g.goals.secondary]) expect(goals).toContain(goal)
      expect(g.source).toMatch(/^https:\/\//)
    }
  })
  it('covers every goal with at least two gyms', () => {
    for (const { value } of QUESTIONS[0].options) {
      expect(GYMS.filter((g) => g.goals.primary.includes(value)).length, value).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('scoring', () => {
  it('weights add up to 100', () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b)).toBe(100)
  })
  it('scores stay between 0 and 100 for every answer combination', () => {
    const [g, b, w, p] = QUESTIONS.map((q) => q.options.map((o) => o.value))
    for (const goal of g) for (const budget of b) for (const when of w) for (const priority of p) {
      for (const r of rankGyms(GYMS, { goal, budget, when, priority }, 'brickell')) {
        expect(r.score).toBeGreaterThanOrEqual(0)
        expect(r.score).toBeLessThanOrEqual(100)
      }
    }
  })
  it('distance is zero within a neighborhood and plausible across town', () => {
    expect(milesBetween('brickell', 'brickell')).toBe(0)
    const d = milesBetween('brickell', 'south-beach')
    expect(d).toBeGreaterThan(3)
    expect(d).toBeLessThan(5)
  })
  it('ranks are sequential and sorted by score', () => {
    const r = rankGyms(GYMS, base, 'brickell')
    expect(r.map((x) => x.rank)).toEqual(r.map((_, i) => i + 1))
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score)
  })
  it('a gym over budget scores lower than an identical one within budget', () => {
    const gym = GYMS.find((g) => g.id === 'metropolis-coral-gables')
    const pricey = { ...gym, tier: 4 }
    expect(scoreGym(pricey, base, 'coral-gables').score).toBeLessThan(scoreGym(gym, base, 'coral-gables').score)
    expect(scoreGym(pricey, base, 'coral-gables').cautions).toContain('Likely over budget')
  })
})

// The answer sets used for the Phase 2 quality check: the top 3 should make sense.
describe('sanity: realistic answer sets', () => {
  const top3 = (answers, near) => rankGyms(GYMS, answers, near).slice(0, 3).map((r) => r.gym)
  it('budget lifter in Coconut Grove gets the budget gym first', () => {
    expect(top3({ goal: 'strength', budget: '1', when: 'early', priority: 'price' }, 'coconut-grove')[0].id).toBe('youfit-coconut-grove')
  })
  it('boxing fan in South Beach gets boxing gyms', () => {
    for (const g of top3({ goal: 'combat', budget: '2', when: 'evening', priority: 'location' }, 'south-beach')) {
      expect(g.goals.primary).toContain('combat')
    }
  })
  it('luxury + recovery in Brickell gets a luxury club', () => {
    expect(top3({ goal: 'strength', budget: '4', when: 'varies', priority: 'amenities' }, 'brickell')[0].recovery).toBe(true)
  })
  it('Pilates/yoga fan gets a mind-body studio first', () => {
    expect(top3({ goal: 'mind-body', budget: '3', when: 'midday', priority: 'community' }, 'wynwood')[0].goals.primary).toContain('mind-body')
  })
  it('CrossFit fan wanting coaching gets a CrossFit box first', () => {
    expect(top3({ goal: 'functional', budget: '3', when: 'early', priority: 'coaching' }, 'wynwood')[0].goals.primary).toContain('functional')
  })
})

describe('shareable links', () => {
  it('round-trips answers through the URL', () => {
    expect(parseAnswers('?' + toQuery(base, 'wynwood'))).toEqual({ answers: base, near: 'wynwood' })
  })
  it('rejects incomplete or invalid answers', () => {
    expect(parseAnswers('?goal=strength')).toBeNull()
    expect(parseAnswers('?' + toQuery({ ...base, budget: '9' }, 'brickell'))).toBeNull()
  })
  it('falls back to Brickell for an unknown area', () => {
    expect(parseAnswers('?' + toQuery(base, 'atlantis')).near).toBe('brickell')
  })
})
