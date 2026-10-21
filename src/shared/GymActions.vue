<script setup>
import { computed } from 'vue'
import { compareFull, inCompare, isSaved, toggleCompare, toggleSaved } from './store.js'
import { gymUrl } from './format.js'

const props = defineProps({
  gym: { type: Object, required: true },
  view: { type: Boolean, default: true },
})

const saved = computed(() => isSaved(props.gym.id))
const comparing = computed(() => inCompare(props.gym.id))
const compareBlocked = computed(() => !comparing.value && compareFull())
</script>

<template>
  <div class="gym-actions">
    <a v-if="view" :href="gymUrl(gym.id)" class="btn btn-secondary btn-sm">
      View<span class="sr-only"> {{ gym.name }}</span>
    </a>
    <button type="button" class="btn btn-secondary btn-sm" :aria-pressed="saved" @click="toggleSaved(gym.id)">
      <span aria-hidden="true">{{ saved ? '♥' : '♡' }}</span> {{ saved ? 'Saved' : 'Save' }}
      <span class="sr-only"> {{ gym.name }}</span>
    </button>
    <button
      type="button"
      class="btn btn-secondary btn-sm"
      :aria-pressed="comparing"
      :disabled="compareBlocked"
      :title="compareBlocked ? 'You can compare up to 4 gyms' : null"
      @click="toggleCompare(gym.id)"
    >
      {{ comparing ? '✓ Comparing' : '+ Compare' }}<span class="sr-only"> {{ gym.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.gym-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.btn-sm { font-size: 14px; padding: 6px 11px; }
.btn[aria-pressed="true"] { border-color: var(--color-primary); background: var(--color-highlight); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
</style>
