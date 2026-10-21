// Gym data for the quiz. Compiled from public listings in October 2026.
// Nothing here has been confirmed with the gyms themselves (verified: false):
// prices are estimated price levels, and addresses are only included where a
// source listed one. Review before launch; Phase 4 moves this into a database.

// Approximate neighborhood centers, used to estimate distance.
export const AREAS = {
  brickell: { label: 'Brickell', lat: 25.7617, lng: -80.1918 },
  downtown: { label: 'Downtown', lat: 25.7743, lng: -80.1937 },
  wynwood: { label: 'Wynwood', lat: 25.801, lng: -80.199 },
  midtown: { label: 'Midtown', lat: 25.809, lng: -80.193 },
  'coconut-grove': { label: 'Coconut Grove', lat: 25.728, lng: -80.243 },
  'coral-gables': { label: 'Coral Gables', lat: 25.749, lng: -80.263 },
  'south-beach': { label: 'South Beach', lat: 25.7826, lng: -80.1341 },
}

// Estimated monthly cost for each price level.
export const TIERS = {
  1: { symbol: '$', range: 'under $50/mo' },
  2: { symbol: '$$', range: '$50–100/mo' },
  3: { symbol: '$$$', range: '$100–200/mo' },
  4: { symbol: '$$$$', range: '$200+/mo' },
}

// goals:     what the gym is built for (primary) and also handles well (secondary)
// access:    'open' = open-gym hours you can drop into; 'classes' = scheduled classes
// coached:   coached classes or training included in the core offer
// recovery:  spa/recovery amenities (sauna, plunge pools, etc.)
// community: class- or team-based culture
const SOURCES = {
  timeout: 'https://timeout.com/miami/things-to-do/best-gyms-in-miami',
  newtimes: 'https://www.miaminewtimes.com/arts-culture/the-ten-best-gyms-in-miami-8146671/',
  secret: 'https://secretmiami.com/best-gyms-miami/',
  beaches: 'https://www.miamiandbeaches.com/things-to-do/health-and-fitness/where-to-workout-in-miami-beach',
  hoodline: 'https://hoodline.com/2019/05/the-4-best-interval-training-gyms-in-miami/',
  wynwoodNew: 'https://www.timeout.com/miami/news/take-a-look-inside-this-luxurious-new-gym-in-wynwood-miami-061124',
}

export const GYMS = [
  {
    id: 'equinox-brickell', name: 'Equinox Brickell', area: 'brickell', address: null,
    type: 'Luxury full-service club', tier: 4,
    goals: { primary: ['strength', 'fat-loss'], secondary: ['mind-body'] },
    access: 'open', coached: true, recovery: true, community: false, source: SOURCES.secret,
  },
  {
    id: 'equinox-south-beach', name: 'Equinox South Beach', area: 'south-beach', address: null,
    type: 'Luxury full-service club', tier: 4,
    goals: { primary: ['strength', 'fat-loss'], secondary: ['mind-body'] },
    access: 'open', coached: true, recovery: true, community: false, source: SOURCES.beaches,
  },
  {
    id: 'equinox-coral-gables', name: 'Equinox Coral Gables', area: 'coral-gables', address: null,
    type: 'Luxury full-service club', tier: 4,
    goals: { primary: ['strength', 'fat-loss'], secondary: ['mind-body'] },
    access: 'open', coached: true, recovery: true, community: false, source: SOURCES.secret,
  },
  {
    id: 'anatomy-midtown', name: 'Anatomy Midtown', area: 'midtown', address: null,
    type: 'Luxury gym with recovery spa', tier: 4,
    goals: { primary: ['strength'], secondary: ['fat-loss', 'mind-body'] },
    access: 'open', coached: true, recovery: true, community: false, source: SOURCES.timeout,
  },
  {
    id: 'anatomy-coconut-grove', name: 'Anatomy Coconut Grove', area: 'coconut-grove', address: null,
    type: 'Luxury gym with recovery spa', tier: 4,
    goals: { primary: ['strength'], secondary: ['fat-loss', 'mind-body'] },
    access: 'open', coached: true, recovery: true, community: false, source: SOURCES.timeout,
  },
  {
    id: 'sweat440-brickell', name: 'SWEAT440 Brickell', area: 'brickell', address: null,
    type: 'Coached HIIT classes', tier: 3,
    goals: { primary: ['fat-loss'], secondary: ['functional'] },
    access: 'classes', coached: true, recovery: false, community: true,
    source: 'https://sweat440.com/gym-membership-near-me-brickell',
  },
  {
    id: 'soulcycle-brickell', name: 'SoulCycle Brickell', area: 'brickell', address: null,
    type: 'Indoor cycling studio', tier: 3,
    goals: { primary: ['fat-loss'], secondary: [] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.newtimes,
  },
  {
    id: 'boxr-downtown', name: 'BOXR Gym', area: 'downtown', address: null,
    type: 'Boxing, CrossFit and yoga', tier: 3,
    goals: { primary: ['combat', 'functional'], secondary: ['mind-body', 'fat-loss'] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.beaches,
  },
  {
    id: 'bodytek-wynwood', name: 'BodyTek Fitness Wynwood', area: 'wynwood', address: '545 NW 28th St',
    type: 'Gym with free weights and interval classes', tier: 2,
    goals: { primary: ['strength', 'fat-loss'], secondary: [] },
    access: 'open', coached: false, recovery: false, community: false, source: SOURCES.hoodline,
  },
  {
    id: 'studio-three-wynwood', name: 'Studio Three Wynwood', area: 'wynwood', address: '90 NW 29th St',
    type: 'Boutique strength, HIIT and yoga classes', tier: 3,
    goals: { primary: ['fat-loss', 'mind-body'], secondary: ['strength'] },
    access: 'classes', coached: true, recovery: true, community: true, source: SOURCES.wynwoodNew,
  },
  {
    id: 'crossfit-wynwood', name: 'CrossFit Wynwood', area: 'wynwood', address: '56 NE 29th St',
    type: 'CrossFit box', tier: 3,
    goals: { primary: ['functional'], secondary: ['strength', 'fat-loss'] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.hoodline,
  },
  {
    id: 'pilathon-wynwood', name: 'Pilathon Wynwood', area: 'wynwood', address: null,
    type: 'Pilates studio', tier: 3,
    goals: { primary: ['mind-body'], secondary: [] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.timeout,
  },
  {
    id: 'metropolis-coral-gables', name: 'Metropolis Fitness', area: 'coral-gables', address: '1430 Madruga Ave',
    type: 'Full gym, 70+ classes a week', tier: 2,
    goals: { primary: ['strength', 'fat-loss'], secondary: ['mind-body'] },
    access: 'open', coached: true, recovery: false, community: true, source: SOURCES.timeout,
  },
  {
    id: 'lion-heart-boxing', name: 'Lion Heart Boxing Gym', area: 'coral-gables', address: '804 S Douglas Rd',
    type: 'Boxing gym', tier: 2,
    goals: { primary: ['combat'], secondary: ['fat-loss'] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.timeout,
  },
  {
    id: 'i-am-crossfit', name: 'I AM CrossFit', area: 'coconut-grove', address: null,
    type: 'CrossFit box with open gym', tier: 3,
    goals: { primary: ['functional'], secondary: ['strength', 'fat-loss'] },
    access: 'classes', coached: true, recovery: false, community: true,
    source: 'https://blog.wodify.com/post/top-crossfit-gyms-in-miami',
  },
  {
    id: 'youfit-coconut-grove', name: 'YouFit Coconut Grove', area: 'coconut-grove', address: '3015 Grand Ave',
    type: 'Budget gym with squat racks', tier: 1,
    goals: { primary: ['strength', 'fat-loss'], secondary: [] },
    access: 'open', coached: false, recovery: false, community: false,
    source: 'https://classpass.com/search/coral-gables/gym-time',
  },
  {
    id: '5th-street-gym', name: '5th Street Gym', area: 'south-beach', address: null,
    type: 'Historic boxing gym', tier: 2,
    goals: { primary: ['combat'], secondary: ['fat-loss'] },
    access: 'open', coached: true, recovery: false, community: true, source: SOURCES.beaches,
  },
  {
    id: 'south-beach-boxing', name: 'South Beach Boxing', area: 'south-beach', address: '715 Washington Ave',
    type: 'Boxing, kickboxing and Muay Thai', tier: 2,
    goals: { primary: ['combat'], secondary: ['fat-loss'] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.beaches,
  },
  {
    id: 'orangetheory-south-beach', name: 'Orangetheory Fitness South Beach', area: 'south-beach', address: '1115 5th St',
    type: 'Heart-rate interval classes', tier: 3,
    goals: { primary: ['fat-loss'], secondary: ['functional'] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.beaches,
  },
  {
    id: 'crossfit-miami-beach', name: 'CrossFit Miami Beach', area: 'south-beach', address: null,
    type: 'CrossFit and Olympic lifting', tier: 3,
    goals: { primary: ['functional', 'strength'], secondary: ['fat-loss'] },
    access: 'classes', coached: true, recovery: false, community: true, source: SOURCES.beaches,
  },
]
