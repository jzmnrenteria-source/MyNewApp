// The four quiz questions. Option values double as URL parameters for shareable results.
export const QUESTIONS = [
  {
    key: 'goal',
    step: 'Goal',
    title: 'What’s your main goal?',
    options: [
      { value: 'strength', label: 'Build strength', desc: 'Free weights, racks, progressive lifting' },
      { value: 'fat-loss', label: 'Lose weight & get fit', desc: 'Cardio, HIIT, conditioning' },
      { value: 'functional', label: 'Athletic & CrossFit', desc: 'Functional training, Olympic lifts' },
      { value: 'combat', label: 'Boxing & martial arts', desc: 'Boxing, kickboxing, Muay Thai' },
      { value: 'mind-body', label: 'Yoga, Pilates & mobility', desc: 'Flexibility, core, low impact' },
    ],
  },
  {
    key: 'budget',
    step: 'Budget',
    title: 'What can you spend each month?',
    options: [
      { value: '1', label: 'Under $50', desc: 'Budget-friendly' },
      { value: '2', label: '$50–100', desc: 'Mid-range gyms and boxing clubs' },
      { value: '3', label: '$100–200', desc: 'Boutique studios and coached classes' },
      { value: '4', label: '$200+', desc: 'Luxury clubs, no limit' },
    ],
  },
  {
    key: 'when',
    step: 'Schedule',
    title: 'When will you usually train?',
    options: [
      { value: 'early', label: 'Early mornings', desc: 'Before 8am' },
      { value: 'midday', label: 'Midday', desc: 'Lunch break or daytime' },
      { value: 'evening', label: 'Evenings', desc: 'After 5pm' },
      { value: 'varies', label: 'It varies', desc: 'Different every week' },
    ],
  },
  {
    key: 'priority',
    step: 'Priority',
    title: 'What matters most?',
    options: [
      { value: 'price', label: 'Lowest price', desc: 'Keep the monthly cost down' },
      { value: 'location', label: 'Close to me', desc: 'Short trip from my neighborhood' },
      { value: 'coaching', label: 'Coaching', desc: 'Coached classes or trainers' },
      { value: 'amenities', label: 'Amenities & recovery', desc: 'Sauna, plunge pools, spa' },
      { value: 'community', label: 'Community', desc: 'Classes and people who keep me going' },
    ],
  },
]

export function labelFor(key, value) {
  const q = QUESTIONS.find((q) => q.key === key)
  return q?.options.find((o) => o.value === value)?.label ?? ''
}
