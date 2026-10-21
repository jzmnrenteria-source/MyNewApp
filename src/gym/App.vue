<script setup>
import { computed, onMounted } from 'vue'
import { AREAS, GYMS } from '../shared/data.js'
import { labelFor } from '../shared/questions.js'
import { milesBetween, scoreGym } from '../shared/scoring.js'
import { accessLabel, areaLabel, directionsUrl, goalLabel, gymUrl, milesLabel, priceLabel, scoreClass } from '../shared/format.js'
import { state } from '../shared/store.js'
import GymActions from '../shared/GymActions.vue'
import MapView from '../shared/MapView.vue'

const id = new URLSearchParams(window.location.search).get('id')
const gym = GYMS.find((g) => g.id === id) ?? null
const near = state.quiz?.near ?? 'brickell'

const match = computed(() => (gym && state.quiz?.answers ? scoreGym(gym, state.quiz.answers, near) : null))
const miles = gym ? milesBetween(near, gym.area) : null
const nearby = gym ? GYMS.filter((g) => g.area === gym.area && g.id !== gym.id) : []
const marker = gym ? [{ key: gym.area, ...AREAS[gym.area], count: nearby.length + 1 }] : []

const facts = gym ? [
  { k: 'Price level', v: priceLabel(gym.tier), s: 'Estimate. Confirm with the gym' },
  { k: 'Access', v: accessLabel(gym), s: gym.access === 'open' ? 'Train whenever it’s open' : 'Book into scheduled classes' },
  { k: 'Coaching', v: gym.coached ? 'Included' : 'Not the focus', s: gym.coached ? 'Coached classes or training' : 'Mostly self-guided' },
  { k: 'Recovery', v: gym.recovery ? 'Yes' : 'Not listed', s: gym.recovery ? 'Spa or recovery amenities' : '' },
  { k: 'Community', v: gym.community ? 'Class-based' : 'Independent', s: '' },
  { k: 'Distance', v: `${milesLabel(miles)} from ${areaLabel(near)}`, s: 'Approximate' },
] : []

onMounted(() => {
  if (gym) document.title = `${gym.name} — FitQuest`
})
</script>

<template>
  <div v-if="!gym" class="empty">
    <h1 class="page-title">Gym not found</h1>
    <p>That gym isn’t in our list. It may have been removed.</p>
    <a href="/explore/" class="btn btn-primary">Explore gyms</a>
  </div>

  <article v-else class="profile">
    <a href="/explore/" class="back">← Back to explore</a>

    <header class="profile-head">
      <div>
        <span class="kicker">{{ areaLabel(gym.area) }} · {{ gym.type }}</span>
        <h1 class="page-title">{{ gym.name }}</h1>
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

        <section aria-labelledby="todo-title" class="pending">
          <h2 id="todo-title" class="section-title">Still to come</h2>
          <p>
            We don’t list membership packages, class schedules, opening hours or reviews for this gym yet,
            because we only publish details we can confirm. Check with the gym directly for now.
          </p>
          <a :href="gym.source" target="_blank" rel="noopener">Where this listing comes from</a>
        </section>
      </div>

      <div class="profile-side">
        <div class="side-card">
          <GymActions :gym="gym" :view="false" />
          <a :href="directionsUrl(gym)" target="_blank" rel="noopener" class="btn btn-primary btn-block">Get directions</a>
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
.match { display: flex; flex-direction: column; align-items: center; padding: 8px 16px; border-radius: var(--radius-md); color: var(--color-on-chip); }
.match-n { font: 700 34px/1 var(--font-heading); }
.match-l { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
.score-hi { background: var(--chip-green); }
.score-mid { background: var(--chip-blue); }
.score-lo { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-divider); }

.profile-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start; }
.profile-main { display: grid; gap: 28px; }
.section-title { font-size: 24px; margin-bottom: 12px; }
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
