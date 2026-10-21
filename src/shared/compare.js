import { milesBetween, scoreGym } from './scoring.js'
import { accessLabel, areaLabel, goalLabel, milesLabel, priceLabel } from './format.js'

// Rows of the compare table. `rank` returns a number where higher is better;
// the best cell(s) in each row get highlighted. Rows without `rank` are info only.
export function compareRows(near, quiz) {
  const rows = []
  if (quiz?.answers) {
    rows.push({
      label: 'Your match', cell: (g) => `${scoreGym(g, quiz.answers, near).score}%`,
      rank: (g) => scoreGym(g, quiz.answers, near).score,
    })
  }
  rows.push(
    { label: 'Neighborhood', cell: (g) => areaLabel(g.area) },
    { label: `Distance from ${areaLabel(near)}`, cell: (g) => milesLabel(milesBetween(near, g.area)), rank: (g) => -milesBetween(near, g.area) },
    { label: 'Price level (est.)', cell: (g) => priceLabel(g.tier), rank: (g) => -g.tier },
    { label: 'Type', cell: (g) => g.type },
    { label: 'Best for', cell: (g) => g.goals.primary.map(goalLabel).join(', ') },
    { label: 'Access', cell: accessLabel, rank: (g) => (g.access === 'open' ? 1 : 0) },
    { label: 'Coaching', cell: (g) => (g.coached ? 'Included' : '—'), rank: (g) => (g.coached ? 1 : 0) },
    { label: 'Recovery amenities', cell: (g) => (g.recovery ? 'Yes' : '—'), rank: (g) => (g.recovery ? 1 : 0) },
    { label: 'Class community', cell: (g) => (g.community ? 'Yes' : '—'), rank: (g) => (g.community ? 1 : 0) },
  )
  return rows
}

// Indexes of the best gym(s) in a row. No highlight when everyone ties.
export function bestIndexes(row, gyms) {
  if (!row.rank || gyms.length < 2) return []
  const vals = gyms.map(row.rank)
  const max = Math.max(...vals)
  if (vals.every((v) => v === max)) return []
  return vals.flatMap((v, i) => (v === max ? [i] : []))
}
