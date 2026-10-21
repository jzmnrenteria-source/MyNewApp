import { describe, expect, it } from 'vitest'
import { GYMS } from '../src/shared/data.js'
import { areaCounts, defaultFilters, filterGyms, sortGyms, activeFilterCount } from '../src/shared/filters.js'
import { compareRows, bestIndexes } from '../src/shared/compare.js'
import { milesBetween } from '../src/shared/scoring.js'
import { directionsUrl } from '../src/shared/format.js'

const f = (over) => ({ ...defaultFilters('brickell'), ...over })

describe('filters', () => {
  it('no filters returns every gym', () => {
    expect(filterGyms(GYMS, f())).toHaveLength(GYMS.length)
    expect(activeFilterCount(f())).toBe(0)
  })
  it('max price keeps only gyms at or under the level', () => {
    const r = filterGyms(GYMS, f({ maxTier: 2 }))
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((g) => g.tier <= 2)).toBe(true)
  })
  it('distance keeps only gyms within range of the chosen area', () => {
    const r = filterGyms(GYMS, f({ near: 'south-beach', maxMiles: 2 }))
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((g) => milesBetween('south-beach', g.area) <= 2)).toBe(true)
  })
  it('goals match primary or secondary goals; any picked goal counts', () => {
    const r = filterGyms(GYMS, f({ goals: ['combat', 'mind-body'] }))
    expect(r.every((g) => [...g.goals.primary, ...g.goals.secondary].some((x) => ['combat', 'mind-body'].includes(x)))).toBe(true)
  })
  it('amenities must all match', () => {
    const r = filterGyms(GYMS, f({ features: ['open', 'recovery'] }))
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((g) => g.access === 'open' && g.recovery)).toBe(true)
  })
  it('neighborhood filter and marker counts agree', () => {
    const counts = areaCounts(GYMS)
    expect(counts.reduce((n, a) => n + a.count, 0)).toBe(GYMS.length)
    for (const a of counts) expect(filterGyms(GYMS, f({ area: a.key }))).toHaveLength(a.count)
  })
  it('impossible combinations return nothing instead of erroring', () => {
    expect(filterGyms(GYMS, f({ maxTier: 1, goals: ['mind-body'] }))).toEqual([])
  })
})

describe('sorting', () => {
  it('without quiz answers, sorts by distance', () => {
    const r = sortGyms(GYMS, 'wynwood', null)
    for (let i = 1; i < r.length; i++) expect(r[i - 1].miles).toBeLessThanOrEqual(r[i].miles)
    expect(r[0].score).toBeNull()
  })
  it('with quiz answers, sorts by match score', () => {
    const r = sortGyms(GYMS, 'brickell', { answers: { goal: 'combat', budget: '2', when: 'evening', priority: 'price' } })
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score)
  })
})

describe('compare', () => {
  const byId = (id) => GYMS.find((g) => g.id === id)
  const gyms = [byId('youfit-coconut-grove'), byId('equinox-brickell'), byId('metropolis-coral-gables')]
  it('highlights the cheapest gym on the price row', () => {
    const row = compareRows('brickell', null).find((r) => r.label.startsWith('Price'))
    expect(bestIndexes(row, gyms)).toEqual([0])
  })
  it('highlights the closest gym on the distance row', () => {
    const row = compareRows('brickell', null).find((r) => r.label.startsWith('Distance'))
    expect(bestIndexes(row, gyms)).toEqual([1])
  })
  it('does not highlight when everyone ties, or for info-only rows', () => {
    const coaching = compareRows('brickell', null).find((r) => r.label === 'Coaching')
    expect(bestIndexes(coaching, [byId('equinox-brickell'), byId('metropolis-coral-gables')])).toEqual([])
    const type = compareRows('brickell', null).find((r) => r.label === 'Type')
    expect(bestIndexes(type, gyms)).toEqual([])
  })
  it('adds a match row only when quiz answers exist', () => {
    expect(compareRows('brickell', null)[0].label).not.toBe('Your match')
    const quiz = { answers: { goal: 'strength', budget: '1', when: 'early', priority: 'price' } }
    expect(compareRows('brickell', quiz)[0].label).toBe('Your match')
  })
})

describe('directions', () => {
  it('uses the street address when known, otherwise the neighborhood', () => {
    expect(directionsUrl(GYMS.find((g) => g.id === 'crossfit-wynwood'))).toContain(encodeURIComponent('56 NE 29th St'))
    expect(directionsUrl(GYMS.find((g) => g.id === 'equinox-brickell'))).toContain('Brickell')
  })
})
