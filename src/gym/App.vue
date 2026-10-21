<script setup>
import { computed, ref, watchEffect } from 'vue'
import { AREAS } from '../shared/data.js'
import { gyms, loadGyms } from '../shared/gyms.js'
import { labelFor } from '../shared/questions.js'
import { milesBetween, scoreGym } from '../shared/scoring.js'
import { accessLabel, areaLabel, directionsUrl, goalLabel, gymUrl, milesLabel, priceLabel, scoreClass } from '../shared/format.js'
import { state } from '../shared/store.js'
import GymActions from '../shared/GymActions.vue'
import MapView from '../shared/MapView.vue'
import ContactForm from './ContactForm.vue'

const id = new URLSearchParams(window.location.search).get('id')
const near = state.quiz?.near ?? 'brickell'
const loaded = ref(false)
loadGyms().then(() => (loaded.value = true))

const gym = computed(() => gyms.value.find((g) => g.id === id) ?? null)
const match = computed(() => (gym.value && state.quiz?.answers ? scoreGym(gym.value, state.quiz.answers, near) : null))
const nearby = computed(() => (gym.value ? gyms.value.filter((g) => g.area === gym.value.area && g.id !== gym.value.id) : []))
const marker = computed(() => (gym.value ? [{ key: gym.value.area, ...AREAS[gym.value.area], count: nearby.value.length + 1 }] : []))
const hasOwnerDetails = computed(() => {
  const g = gym.value
  return !!(g && (g.description || g.hours || g.priceNote || g.website || g.phone))
})
const missing = computed(() => {
  const g = gym.value
  if (!g) return []
  return [!g.description && 'packages', !g.description && 'class schedule', !g.hours && 'opening hours', 'reviews'].filter(Boolean)
})

const facts = computed(() => {
  const g = gym.value
  if (!g) return []
  const miles = milesBetween(near, g.area)
  return [
    { k: 'Price level', v: priceLabel(g.tier), s: g.priceNote ? 'See pricing from the gym above' : 'Estimate. Confirm with the gym' },
    { k: 'Access', v: accessLabel(g), s: g.access === 'open' ? 'Train whenever it’s open' : 'Book into scheduled classes' },
    { k: 'Coaching', v: g.coached ? 'Included' : 'Not the focus', s: g.coached ? 'Coached classes or training' : 'Mostly self-guided' },
    { k: 'Recovery', v: g.recovery ? 'Yes' : 'Not listed', s: g.recovery ? 'Spa or recovery amenities' : '' },
    { k: 'Community', v: g.community ? 'Class-based' : 'Independent', s: '' },
    { k: 'Distance', v: `${milesLabel(miles)} from ${areaLabel(near)}`, s: 'Approximate' },
  ]
})

watchEffect(() => {
  if (gym.value) document.title = `${gym.value.name} — FitQuest`
})
</script>

<template>
  <p v-if="!gym && !loaded" class="muted" role="status">Loading…</p>

  <div v-else-if="!gym" class="empty">
    <h1 class="page-title">Gym not found</h1>
    <p>That gym isn’t in our list. It may have been removed.</p>
    <a href="/explore/" class="btn btn-primary">Explore gyms</a>
  </div>

  <article v-else class="profile">
    <a href="/explore/" class="back">← Back to explore</a>

    <header class="profile-head">
      <div>
        <span class="kicker">{{ areaLabel(gym.area) }} · {{ gym.type }}</span>
        <h1 class="page-title">
          {{ gym.name }}
          <span v-if="gym.verified" class="verified" title="Details confirmed by FitQuest">✓ Verified</span>
        </h1>
        <p class="muted">
          <template v-if="gym.address">{{ gym.address }}, </template>{{ areaLabel(gym.area) }}, Miami
        </p>
      </div>
      <div v-if="match" class="match" :class="scoreClass(match.score)">
        <span class="match-n">{{ match.score }}%</span>
        <span class="match-l">match for you</span>
      </div>
    </header>

    <div class="profile-grid">
      <div class="profile-main">
        <section v-if="hasOwnerDetails" aria-labelledby="about-title" class="about">
          <h2 id="about-title" class="section-title">From the gym</h2>
          <p v-if="gym.description" class="about-text">{{ gym.description }}</p>
          <dl class="about-list">
            <template v-if="gym.hours"><dt>Hours</dt><dd>{{ gym.hours }}</dd></template>
            <template v-if="gym.priceNote"><dt>Pricing</dt><dd>{{ gym.priceNote }}</dd></template>
            <template v-if="gym.phone"><dt>Phone</dt><dd><a :href="`tel:${gym.phone.replace(/[^+\d]/g, '')}`">{{ gym.phone }}</a></dd></template>
            <template v-if="gym.website"><dt>Website</dt><dd><a :href="gym.website" target="_blank" rel="noopener nofollow">{{ gym.website.replace(/^https:\/\/(www\.)?/, '') }}</a></dd></template>
          </dl>
          <p class="muted small">Provided by the gym’s owner.</p>
        </section>

        <section aria-labelledby="facts-title">
          <h2 id="facts-title" class="section-title">At a glance</h2>
          <dl class="facts">
            <div v-for="f in facts" :key="f.k" class="fact">
              <dt>{{ f.k }}</dt>
              <dd>{{ f.v }}<span v-if="f.s" class="fact-s">{{ f.s }}</span></dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="goals-title">
          <h2 id="goals-title" class="section-title">Best for</h2>
          <ul class="chips">
            <li v-for="g in gym.goals.primary" :key="g" class="chip chip-green">{{ goalLabel(g) }}</li>
            <li v-for="g in gym.goals.secondary" :key="g" class="chip chip-blue">Also: {{ goalLabel(g) }}</li>
          </ul>
        </section>

        <section v-if="match" aria-labelledby="why-title">
          <h2 id="why-title" class="section-title">How it fits your answers</h2>
          <p class="muted small">
            {{ ['goal', 'budget', 'when', 'priority'].map((k) => labelFor(k, state.quiz.answers[k])).join(' · ') }}
            · <a href="/quiz/">Change answers</a>
          </p>
          <ul class="chips">
            <li v-for="t in match.reasons" :key="t" class="chip chip-green">{{ t }}</li>
            <li v-for="t in match.cautions" :key="t" class="chip chip-yellow">{{ t }}</li>
          </ul>
        </section>
        <p v-else class="quiz-cta">
          <a href="/quiz/">Take the 60-second quiz</a> to see how well {{ gym.name }} fits you.
        </p>

        <ContactForm :gym="gym" />

        <section aria-labelledby="todo-title" class="pending">
          <h2 id="todo-title" class="section-title">Still to come</h2>
          <p>
            We only publish details we can confirm, so {{ gym.name }}’s {{ missing.join(', ') }}
            {{ missing.length === 1 ? 'isn’t' : 'aren’t' }} listed yet. Check with the gym directly for now.
          </p>
          <p v-if="!gym.ownerId">Own or manage this gym? <a href="/owner/">Claim this listing</a> to add your details.</p>
          <a v-if="gym.source" :href="gym.source" target="_blank" rel="noopener">Where this listing comes from</a>
        </section>
      </div>

      <div class="profile-side">
        <div class="side-card">
          <GymActions :gym="gym" :view="false" />
          <a :href="directionsUrl(gym)" target="_blank" rel="noopener" class="btn btn-primary btn-block">Get directions</a>
          <span v-if="gym.offersDayPass" class="chip chip-green day-pass">Free day pass available</span>
        </div>
        <div class="side-map">
          <MapView :areas="marker" :selected="gym.area" :label="`Map showing ${areaLabel(gym.area)}`" />
          <p class="map-note">Shows the neighborhood, not the exact address.</p>
        </div>
        <div v-if="nearby.length" class="side-card">
          <h2 class="side-title">Also in {{ areaLabel(gym.area) }}</h2>
          <ul class="nearby">
            <li v-for="g in nearby" :key="g.id"><a :href="gymUrl(g.id)">{{ g.name }}</a><span class="muted"> · {{ g.type }}</span></li>
          </ul>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.back { display: inline-block; margin-bottom: 14px; font-size: 15px; }
.profile-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
.profile-head p { margin: 0; }
.verified {
  display: inline-block; vertical-align: middle; margin-left: 8px; padding: 3px 9px; border-radius: 999px;
  font: 600 13px var(--font-body); letter-spacing: 0; background: var(--chip-green); color: var(--color-on-chip);
}
.match { display: flex; flex-direction: column; align-items: center; padding: 8px 16px; border-radius: var(--radius-md); color: var(--color-on-chip); }
.match-n { font: 700 34px/1 var(--font-heading); }
.match-l { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
.score-hi { background: var(--chip-green); }
.score-mid { background: var(--chip-blue); }
.score-lo { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-divider); }

.profile-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start; }
.profile-main { display: grid; gap: 28px; min-width: 0; }
.section-title { font-size: 24px; margin-bottom: 12px; }
.profile-main :deep(.section-title) { font-size: 24px; margin-bottom: 12px; }
.about { padding: 20px; border-radius: var(--radius-md); background: var(--color-highlight); }
.about-text { white-space: pre-line; }
.about-list { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; margin: 0 0 10px; }
.about-list dt { font-weight: 600; }
.about-list dd { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
.facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 0; }
.fact { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 14px; }
.fact dt { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--color-kicker); font-weight: 600; }
.fact dd { margin: 4px 0 0; font: 600 18px/1.25 var(--font-heading); }
.fact-s { display: block; font: 400 13px/1.4 var(--font-body); color: var(--color-muted); margin-top: 2px; }
.chips { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.quiz-cta { margin: 0; padding: 16px; border-radius: var(--radius-md); background: var(--color-highlight); }
.pending { padding: 18px; border: 1px dashed var(--color-divider); border-radius: var(--radius-md); }
.pending p { color: var(--color-muted); }

.profile-side { display: grid; gap: 14px; position: sticky; top: 80px; }
.side-card { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 16px; display: grid; gap: 10px; }
.day-pass { justify-self: start; }
.btn-block { width: 100%; }
.side-map { height: 280px; display: flex; flex-direction: column; gap: 6px; }
.map-note { font-size: 12px; color: var(--color-muted); margin: 0; }
.side-title { font-size: 18px; margin: 0; }
.nearby { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; font-size: 15px; }

@media (max-width: 920px) {
  .profile-grid { grid-template-columns: 1fr; }
  .profile-side { position: static; }
  .facts { grid-template-columns: 1fr 1fr; }
}
</style>
