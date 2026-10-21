<script setup>
import { computed } from 'vue'
import { GYMS } from '../shared/data.js'
import { MAX_COMPARE, state, toggleCompare } from '../shared/store.js'
import { compareRows, bestIndexes } from '../shared/compare.js'
import { areaLabel, gymUrl } from '../shared/format.js'

// A shared link (?ids=a,b,c) replaces this browser's compare list.
const shared = new URLSearchParams(window.location.search).get('ids')
if (shared) {
  const ids = shared.split(',').filter((id) => GYMS.some((g) => g.id === id)).slice(0, MAX_COMPARE)
  if (ids.length) state.compare.splice(0, state.compare.length, ...ids)
  window.history.replaceState(null, '', window.location.pathname)
}

const near = computed(() => state.quiz?.near ?? 'brickell')
const gyms = computed(() => state.compare.map((id) => GYMS.find((g) => g.id === id)).filter(Boolean))
const rows = computed(() => compareRows(near.value, state.quiz))
const best = computed(() => rows.value.map((r) => new Set(bestIndexes(r, gyms.value))))
</script>

<template>
  <header class="compare-head">
    <h1 class="page-title">Compare gyms</h1>
    <p class="muted">Up to {{ MAX_COMPARE }} gyms. Shaded cells mark the strongest option in each row.</p>
  </header>

  <div v-if="gyms.length < 2" class="empty">
    <p v-if="gyms.length === 1">You’ve added <strong>{{ gyms[0].name }}</strong>. Add at least one more gym to compare.</p>
    <p v-else>Add at least two gyms to compare them side by side.</p>
    <p>
      <a href="/explore/" class="btn btn-primary">Explore gyms</a>
      <a href="/saved/" class="btn btn-secondary">Your saved gyms</a>
    </p>
  </div>

  <div v-else class="table-wrap" tabindex="0" role="region" aria-label="Comparison table (scrolls sideways)">
    <table class="compare">
      <thead>
        <tr>
          <td></td>
          <th v-for="g in gyms" :key="g.id" scope="col">
            <a :href="gymUrl(g.id)" class="gym-link">{{ g.name }}</a>
            <span class="gym-sub">{{ areaLabel(g.area) }}</span>
            <button type="button" class="remove" @click="toggleCompare(g.id)">
              Remove<span class="sr-only"> {{ g.name }}</span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="row.label">
          <th scope="row">{{ row.label }}</th>
          <td v-for="(g, gi) in gyms" :key="g.id" :class="{ best: best[ri].has(gi) }">
            {{ row.cell(g) }}<span v-if="best[ri].has(gi)" class="sr-only"> (best)</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-if="gyms.length >= 2" class="note">Prices are estimated levels and distances are approximate. Confirm with each gym.</p>
</template>

<style scoped>
.compare-head { margin-bottom: 20px; }
.compare-head p { margin: 0; }
.empty .btn { margin: 4px; }
/* position: relative keeps the hidden screen-reader labels inside the scroll box */
.table-wrap { position: relative; overflow-x: auto; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-card); }
.table-wrap:focus-visible { outline: 2px solid var(--color-accent); }
.compare { width: 100%; border-collapse: collapse; min-width: 640px; font-size: 15px; }
.compare th, .compare td { padding: 12px 14px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--color-divider); }
.compare tbody tr:last-child > * { border-bottom: 0; }
.compare thead th { vertical-align: bottom; min-width: 150px; }
.compare tbody th { font-weight: 600; font-size: 13px; color: var(--color-muted); width: 180px; }
.gym-link { display: block; font: 600 19px/1.2 var(--font-heading); color: var(--color-text); text-decoration: none; }
.gym-link:hover { text-decoration: underline; }
.gym-sub { display: block; font-size: 13px; font-weight: 400; color: var(--color-muted); }
.remove { margin-top: 6px; padding: 0; border: 0; background: none; color: var(--color-link); font: inherit; font-size: 13px; text-decoration: underline; cursor: pointer; }
td.best { background: var(--color-best); font-weight: 600; }
.note { margin-top: 12px; font-size: 13px; color: var(--color-muted); }
</style>
