<script setup>
import { computed } from 'vue'
import { gyms } from '../shared/gyms.js'
import { MAX_COMPARE, setNote, state, toggleSaved } from '../shared/store.js'
import { areaLabel, gymUrl, priceLabel } from '../shared/format.js'
import GymActions from '../shared/GymActions.vue'

const items = computed(() =>
  state.saved.map((s) => ({ ...s, gym: gyms.value.find((g) => g.id === s.id) })).filter((s) => s.gym),
)

function compareAll() {
  state.compare.splice(0, state.compare.length, ...items.value.slice(0, MAX_COMPARE).map((s) => s.id))
  window.location.href = '/compare/'
}
</script>

<template>
  <header class="saved-head">
    <div>
      <h1 class="page-title">Saved gyms</h1>
      <p class="muted">Your shortlist. Add notes after a visit or a trial pass. Saved in this browser only.</p>
    </div>
    <button v-if="items.length >= 2" type="button" class="btn btn-primary" @click="compareAll">
      Compare {{ items.length > MAX_COMPARE ? `first ${MAX_COMPARE}` : 'all' }} saved
    </button>
  </header>

  <div v-if="!items.length" class="empty">
    <p>Nothing saved yet. Tap ♡ Save on any gym in Explore or your quiz results.</p>
    <a href="/explore/" class="btn btn-primary">Explore gyms</a>
  </div>

  <ul v-else class="saved-list">
    <li v-for="s in items" :key="s.id" class="saved-item">
      <div class="saved-top">
        <div>
          <h2 class="gym-name"><a :href="gymUrl(s.id)">{{ s.gym.name }}</a></h2>
          <p class="gym-meta">{{ areaLabel(s.gym.area) }} · {{ s.gym.type }} · {{ priceLabel(s.gym.tier) }}</p>
        </div>
        <button type="button" class="remove" @click="toggleSaved(s.id)">
          Remove<span class="sr-only"> {{ s.gym.name }}</span>
        </button>
      </div>
      <label class="note">
        <span class="note-label">Your notes</span>
        <textarea
          class="input"
          rows="2"
          maxlength="500"
          :value="s.note"
          placeholder="e.g. Visited Tuesday, racks were free at 7am"
          @input="setNote(s.id, $event.target.value)"
        ></textarea>
      </label>
      <GymActions :gym="s.gym" />
    </li>
  </ul>
</template>

<style scoped>
.saved-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.saved-head p { margin: 0; }
.empty p { margin-bottom: 14px; }
.saved-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.saved-item { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 16px; display: grid; gap: 12px; }
.saved-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.gym-name { font-size: 21px; margin: 0 0 2px; }
.gym-name a { color: inherit; text-decoration: none; }
.gym-name a:hover { text-decoration: underline; }
.gym-meta { margin: 0; font-size: 14px; color: var(--color-muted); }
.remove { padding: 0; border: 0; background: none; color: var(--color-link); font: inherit; font-size: 14px; text-decoration: underline; cursor: pointer; }
.note { display: grid; gap: 5px; }
.note-label { font-size: 13px; color: var(--color-muted); }
textarea.input { resize: vertical; min-height: 64px; }
</style>
