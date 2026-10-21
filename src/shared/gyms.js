// The gym list every page uses. Starts with the bundled list so pages render
// instantly, then switches to the live list from the database when it arrives.
// If the database can't be reached (e.g. the free project is paused), the
// bundled list stays in place and the site keeps working.
import { shallowRef } from 'vue'
import { GYMS } from './data.js'
import { supabase } from './supabase.js'

export const gyms = shallowRef(GYMS)
export const gymsSource = shallowRef('bundled') // 'bundled' | 'live'

export function fromRow(r) {
  return {
    id: r.id, name: r.name, area: r.area, address: r.address, type: r.type, tier: r.tier,
    goals: { primary: r.goals_primary ?? [], secondary: r.goals_secondary ?? [] },
    access: r.access, coached: r.coached, recovery: r.recovery, community: r.community,
    source: r.source, verified: r.verified, published: r.published, ownerId: r.owner_id,
    description: r.description, hours: r.hours, priceNote: r.price_note,
    website: r.website, phone: r.phone, offersDayPass: r.offers_day_pass,
  }
}

let loading
export function loadGyms() {
  if (!supabase) return Promise.resolve(gyms.value)
  loading ??= supabase
    .from('gyms')
    .select('*')
    .eq('published', true)
    .order('name')
    .then(({ data, error }) => {
      if (error || !data?.length) return gyms.value
      gyms.value = data.map(fromRow)
      gymsSource.value = 'live'
      return gyms.value
    })
    .catch(() => gyms.value)
  return loading
}

export const findGym = (id) => gyms.value.find((g) => g.id === id) ?? null

loadGyms()
