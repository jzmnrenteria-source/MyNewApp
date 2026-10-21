<script setup>
import { computed, onMounted, ref } from 'vue'
import { AREAS, GYMS, TIERS } from './data.js'
import { labelFor } from './questions.js'
import { rankGyms } from './scoring.js'

const props = defineProps({ answers: { type: Object, required: true } })
const near = defineModel('near', { type: String, required: true })
defineEmits(['restart'])

const heading = ref(null)
const copied = ref(false)

const ranked = computed(() => rankGyms(GYMS, props.answers, near.value))
const top = computed(() => ranked.value[0])
const summary = computed(() =>
  ['goal', 'budget', 'when', 'priority'].map((k) => labelFor(k, props.answers[k])).join(' · '),
)

function milesLabel(m) {
  return m < 0.5 ? 'nearby' : `~${m.toFixed(1)} mi`
}
function scoreClass(s) {
  return s >= 80 ? 'score-hi' : s >= 60 ? 'score-mid' : 'score-lo'
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 2500)
  } catch {
    window.prompt('Copy this link:', window.location.href)
  }
}

onMounted(() => heading.value?.focus())
</script>

<template>
  <section class="results" aria-labelledby="results-title">
    <header class="results-head">
      <div>
        <span class="kicker">Your matches</span>
        <h1 id="results-title" ref="heading" tabindex="-1">Your best fit is {{ top.gym.name }}</h1>
        <p class="muted">Ranked for: {{ summary }}</p>
      </div>
      <div class="results-tools">
        <label class="near">
          <span>Distances from</span>
          <select v-model="near" class="input">
            <option v-for="(a, key) in AREAS" :key="key" :value="key">{{ a.label }}</option>
          </select>
        </label>
        <div class="tool-buttons">
          <button type="button" class="btn btn-secondary" @click="$emit('restart')">Change answers</button>
          <button type="button" class="btn btn-secondary" @click="copyLink">
            {{ copied ? 'Link copied' : 'Share results' }}
          </button>
        </div>
        <span class="sr-only" aria-live="polite">{{ copied ? 'Link copied to clipboard' : '' }}</span>
      </div>
    </header>

    <ol class="result-list">
      <li v-for="r in ranked" :key="r.gym.id" class="result" :class="{ top: r.rank === 1 }">
        <span class="rank" aria-hidden="true">{{ r.rank }}</span>
        <div class="result-body">
          <h2 class="result-name">
            <span class="sr-only">Rank {{ r.rank }}: </span>{{ r.gym.name }}
          </h2>
          <p class="result-meta">
            {{ AREAS[r.gym.area].label }} · {{ milesLabel(r.miles) }} ·
            <span :title="`Estimated ${TIERS[r.gym.tier].range}`">
              {{ TIERS[r.gym.tier].symbol }} <span class="est">est. {{ TIERS[r.gym.tier].range }}</span>
            </span>
          </p>
          <p class="result-type">
            {{ r.gym.type }}<template v-if="r.gym.address"> · {{ r.gym.address }}</template>
            · <a :href="r.gym.source" target="_blank" rel="noopener">Source</a>
          </p>
          <ul class="chips" aria-label="Why it ranks here">
            <li v-for="t in r.reasons" :key="t" class="chip chip-green">{{ t }}</li>
            <li v-for="t in r.cautions" :key="t" class="chip chip-yellow">{{ t }}</li>
          </ul>
        </div>
        <div class="score" :class="scoreClass(r.score)">
          <span class="score-n">{{ r.score }}%</span>
          <span class="score-l">match</span>
        </div>
      </li>
    </ol>

    <p class="disclaimer">
      Prices are estimated price levels and gym details come from public listings and press. Distances are approximate,
      measured between neighborhood centers. Always confirm hours, prices and availability with the gym before joining.
    </p>
  </section>
</template>

<style scoped>
.results { max-width: 900px; margin: 0 auto; }
.results-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; }
h1 { font-size: clamp(30px, 5vw, 44px); margin-bottom: 6px; }
h1:focus { outline: none; }
.results-head p { margin: 0; }
.results-tools { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
.near { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-muted); }
.near .input { width: auto; min-height: 38px; }
.tool-buttons { display: flex; gap: 8px; flex-wrap: wrap; }

.result-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.result {
  display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: start;
  padding: 18px; border-radius: var(--radius-md);
  background: var(--color-card); border: 1px solid var(--color-divider);
}
.result.top { border-color: var(--color-primary); background: var(--color-highlight); box-shadow: var(--shadow-md); }
.rank {
  width: 32px; height: 32px; display: grid; place-items: center;
  font-family: var(--font-heading); font-weight: 700; font-size: 17px;
  background: var(--color-rank-bg); color: var(--color-rank-text); border-radius: var(--radius-sm);
}
.result-name { font-size: 22px; margin: 0 0 2px; }
.result-meta, .result-type { margin: 0; font-size: 14px; color: var(--color-muted); }
.est { font-size: 13px; }
.chips { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-wrap: wrap; gap: 6px; }
.score {
  display: flex; flex-direction: column; align-items: center; min-width: 64px;
  padding: 6px 10px; border-radius: var(--radius-sm); color: var(--color-on-chip);
}
.score-n { font-family: var(--font-heading); font-weight: 700; font-size: 24px; line-height: 1.1; }
.score-l { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
.score-hi { background: var(--chip-green); }
.score-mid { background: var(--chip-blue); }
.score-lo { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-divider); }
.disclaimer { margin-top: 24px; font-size: 13px; color: var(--color-muted); max-width: 70ch; }

@media (max-width: 640px) {
  .results-tools { align-items: stretch; width: 100%; }
  .near { justify-content: space-between; }
  .tool-buttons .btn { flex: 1; }
  .result { grid-template-columns: auto 1fr; gap: 12px; padding: 14px; }
  .score { grid-column: 2; flex-direction: row; gap: 6px; justify-self: start; align-items: baseline; }
}
</style>
