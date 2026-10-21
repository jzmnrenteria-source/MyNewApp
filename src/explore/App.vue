<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { AREAS } from '../shared/data.js'
import { gyms } from '../shared/gyms.js'
import { QUESTIONS, labelFor } from '../shared/questions.js'
import { DISTANCES, FEATURES, PRICES, activeFilterCount, areaCounts, defaultFilters, filterGyms, sortGyms } from '../shared/filters.js'
import { areaLabel, gymUrl, milesLabel, priceLabel, scoreClass } from '../shared/format.js'
import { state } from '../shared/store.js'
import GymActions from '../shared/GymActions.vue'
import MapView from '../shared/MapView.vue'

const GOALS = QUESTIONS[0].options
const f = reactive(defaultFilters(state.quiz?.near ?? 'brickell'))
const view = ref('list') // mobile only: 'list' | 'map'
const mapRef = ref(null)
const filtersOpen = ref(true)

const filtered = computed(() => filterGyms(gyms.value, f))
const results = computed(() => sortGyms(filtered.value, f.near, state.quiz))
// Markers count gyms that pass every filter except the neighborhood one itself.
const markers = computed(() => areaCounts(filterGyms(gyms.value, { ...f, area: null })))
const ranked = computed(() => !!state.quiz?.answers)
const quizSummary = computed(() =>
  ranked.value ? ['goal', 'budget', 'when', 'priority'].map((k) => labelFor(k, state.quiz.answers[k])).join(' · ') : '',
)
const countLabel = computed(() => `${results.value.length} gym${results.value.length === 1 ? '' : 's'}`)

function clearAll() {
  Object.assign(f, defaultFilters(f.near))
}
function selectArea(key) {
  f.area = key
}
async function showMap() {
  view.value = 'map'
  await nextTick()
  mapRef.value?.refresh()
}

onMounted(() => {
  // Start with filters collapsed on small screens
  filtersOpen.value = !window.matchMedia('(max-width: 640px)').matches
})
</script>

<template>
  <header class="explore-head">
    <div>
      <h1 class="page-title">Explore gyms</h1>
      <p v-if="ranked" class="muted">
        Ranked by your quiz: {{ quizSummary }} · <a href="/quiz/">Edit answers</a>
      </p>
      <p v-else class="muted">Sorted by distance. <a href="/quiz/">Take the quiz</a> to rank gyms by how well they fit you.</p>
    </div>
    <div class="seg view-toggle" role="group" aria-label="Show as">
      <button type="button" :aria-pressed="view === 'list'" @click="view = 'list'">List</button>
      <button type="button" :aria-pressed="view === 'map'" @click="showMap">Map</button>
    </div>
  </header>

  <details class="filters" :open="filtersOpen" @toggle="filtersOpen = $event.target.open">
    <summary>
      Filters<span v-if="activeFilterCount(f)" class="filter-count">{{ activeFilterCount(f) }}</span>
    </summary>
    <div class="filter-grid">
      <label class="field">
        <span class="field-label">Max monthly price (est.)</span>
        <select v-model.number="f.maxTier" class="input">
          <option v-for="p in PRICES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label">Distance from</span>
        <select v-model="f.near" class="input">
          <option v-for="(a, key) in AREAS" :key="key" :value="key">{{ a.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label">Distance</span>
        <select v-model.number="f.maxMiles" class="input">
          <option v-for="d in DISTANCES" :key="d.value" :value="d.value">{{ d.label }}</option>
        </select>
      </label>
      <fieldset class="field checks">
        <legend class="field-label">Training style</legend>
        <label v-for="g in GOALS" :key="g.value" class="check">
          <input v-model="f.goals" type="checkbox" :value="g.value"> {{ g.label }}
        </label>
      </fieldset>
      <fieldset class="field checks">
        <legend class="field-label">Amenities</legend>
        <label v-for="x in FEATURES" :key="x.value" class="check">
          <input v-model="f.features" type="checkbox" :value="x.value"> {{ x.label }}
        </label>
      </fieldset>
    </div>
    <div class="filter-foot">
      <span class="muted" aria-live="polite">{{ countLabel }}</span>
      <button type="button" class="btn btn-secondary btn-sm" :disabled="!activeFilterCount(f)" @click="clearAll">Clear all</button>
    </div>
  </details>

  <div class="area-chips" role="group" aria-label="Neighborhood">
    <button type="button" class="area-chip" :aria-pressed="!f.area" @click="selectArea(null)">All areas</button>
    <button
      v-for="m in markers"
      :key="m.key"
      type="button"
      class="area-chip"
      :aria-pressed="f.area === m.key"
      :disabled="!m.count && f.area !== m.key"
      @click="selectArea(f.area === m.key ? null : m.key)"
    >
      {{ m.label }} <span class="n">{{ m.count }}</span>
    </button>
  </div>

  <div class="explore-body" :class="`show-${view}`">
    <section class="explore-list" aria-label="Gyms">
      <p v-if="!results.length" class="empty">
        No gyms match these filters. Try a wider distance or a higher price.
        <button type="button" class="btn btn-secondary btn-sm" @click="clearAll">Clear filters</button>
      </p>
      <ol v-else class="cards">
        <li v-for="r in results" :key="r.gym.id" class="card-gym">
          <div class="card-top">
            <div>
              <h2 class="gym-name"><a :href="gymUrl(r.gym.id)">{{ r.gym.name }}</a></h2>
              <p class="gym-meta">{{ areaLabel(r.gym.area) }} · {{ milesLabel(r.miles) }} · {{ priceLabel(r.gym.tier) }}</p>
              <p class="gym-meta">{{ r.gym.type }}</p>
            </div>
            <span v-if="r.score != null" class="score-badge" :class="scoreClass(r.score)">
              {{ r.score }}%<span class="sr-only"> match</span>
            </span>
          </div>
          <GymActions :gym="r.gym" />
        </li>
      </ol>
    </section>
    <div class="explore-map">
      <MapView ref="mapRef" :areas="markers" :selected="f.area" @select="selectArea" />
      <p class="map-note">Markers show neighborhoods, not exact gym locations.</p>
    </div>
  </div>
</template>

<style scoped>
.explore-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.explore-head p { margin: 0; }
.seg { display: inline-flex; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; }
.seg button { border: 0; background: transparent; color: var(--color-text); font: 600 15px var(--font-heading); padding: 8px 16px; cursor: pointer; }
.seg button + button { border-left: 1px solid var(--color-divider); }
.seg button[aria-pressed="true"] { background: var(--color-primary); color: var(--color-on-primary); }
.view-toggle { display: none; }

.filters { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); padding: 14px 18px; margin-bottom: 14px; }
.filters summary { cursor: pointer; font: 600 17px var(--font-heading); }
.filter-count { margin-left: 8px; padding: 1px 8px; border-radius: 999px; font-size: 13px; background: var(--color-primary); color: var(--color-on-primary); }
.filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 18px; margin-top: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.field-label { font-size: 13px; color: var(--color-muted); padding: 0; }
fieldset.field { border: 0; margin: 0; padding: 0; }
.checks { grid-column: span 3; flex-direction: row; flex-wrap: wrap; gap: 6px 16px; }
.checks legend { width: 100%; margin-bottom: 4px; }
.check { display: inline-flex; align-items: center; gap: 7px; font-size: 15px; cursor: pointer; }
.check input { width: 17px; height: 17px; accent-color: var(--color-primary); }
.filter-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }

.area-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.area-chip {
  border: 1px solid var(--color-divider); background: var(--color-card); color: var(--color-text);
  border-radius: 999px; padding: 5px 12px; font: 500 14px var(--font-body); cursor: pointer;
}
.area-chip .n { color: var(--color-muted); margin-left: 2px; }
.area-chip[aria-pressed="true"] { background: var(--color-primary); color: var(--color-on-primary); border-color: var(--color-primary); }
.area-chip[aria-pressed="true"] .n { color: inherit; }
.area-chip:disabled { opacity: .45; cursor: not-allowed; }

.explore-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 440px); gap: 18px; align-items: start; }
.explore-map { position: sticky; top: 80px; height: calc(100vh - 110px); max-height: 640px; display: flex; flex-direction: column; gap: 6px; }
.map-note { font-size: 12px; color: var(--color-muted); margin: 0; }
.cards { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.card-gym { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 16px; display: grid; gap: 12px; }
.card-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.gym-name { font-size: 21px; margin: 0 0 2px; }
.gym-name a { color: inherit; text-decoration: none; }
.gym-name a:hover { text-decoration: underline; }
.gym-meta { margin: 0; font-size: 14px; color: var(--color-muted); }
.score-badge { font: 700 19px var(--font-heading); padding: 4px 9px; border-radius: var(--radius-sm); color: var(--color-on-chip); white-space: nowrap; }
.score-hi { background: var(--chip-green); }
.score-mid { background: var(--chip-blue); }
.score-lo { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-divider); }
.empty { display: grid; gap: 12px; justify-items: center; }

@media (max-width: 920px) {
  .filter-grid { grid-template-columns: 1fr 1fr; }
  .checks { grid-column: span 2; }
  .view-toggle { display: inline-flex; }
  .explore-body { grid-template-columns: 1fr; }
  .explore-map { position: static; height: 65vh; }
  .show-list .explore-map, .show-map .explore-list { display: none; }
}
@media (max-width: 640px) {
  .filter-grid { grid-template-columns: 1fr; }
  .checks { grid-column: span 1; }
}
</style>
