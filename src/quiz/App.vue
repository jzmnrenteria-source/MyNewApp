<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { QUESTIONS } from '../shared/questions.js'
import { parseAnswers, toQuery } from '../shared/scoring.js'
import Results from './Results.vue'

// Start on the results if the URL already carries a full set of answers (a shared link).
const fromUrl = parseAnswers(window.location.search)
const answers = ref(fromUrl ? fromUrl.answers : {})
const near = ref(fromUrl ? fromUrl.near : 'brickell')
const step = ref(fromUrl ? QUESTIONS.length : 0)
const heading = ref(null)

const question = computed(() => QUESTIONS[step.value])
const showResults = computed(() => step.value >= QUESTIONS.length)
const canContinue = computed(() => question.value && answers.value[question.value.key] != null)
const nextLabel = computed(() => (step.value === QUESTIONS.length - 1 ? 'See my matches' : 'Next'))

function next() {
  if (canContinue.value) step.value++
}
function back() {
  if (step.value > 0) step.value--
}
function restart() {
  step.value = 0
}

// Keep the address bar in sync so results can be shared or bookmarked.
watch([showResults, answers, near], () => {
  const url = showResults.value ? `?${toQuery(answers.value, near.value)}` : window.location.pathname
  window.history.replaceState(null, '', url)
}, { deep: true, immediate: true })

// Move focus to the new heading on each step, so keyboard and screen reader users follow along.
watch(step, async () => {
  await nextTick()
  heading.value?.focus()
  window.scrollTo({ top: 0 })
})
</script>

<template>
  <Results
    v-if="showResults"
    :answers="answers"
    v-model:near="near"
    @restart="restart"
  />

  <section v-else class="quiz" aria-labelledby="quiz-title">
    <div class="quiz-top">
      <ol class="progress" aria-label="Quiz progress">
        <li
          v-for="(q, i) in QUESTIONS"
          :key="q.key"
          :class="{ done: i < step, current: i === step }"
          :aria-current="i === step ? 'step' : null"
        >
          <span class="progress-n">{{ i + 1 }}</span> {{ q.step }}
        </li>
      </ol>
      <a href="/" class="skip-link">Back to home</a>
    </div>

    <form class="quiz-card" @submit.prevent="next">
      <fieldset>
        <legend class="sr-only">{{ question.title }}</legend>
        <span class="kicker">Step {{ step + 1 }} of {{ QUESTIONS.length }}</span>
        <h1 id="quiz-title" ref="heading" tabindex="-1">{{ question.title }}</h1>
        <div class="options">
          <label
            v-for="o in question.options"
            :key="o.value"
            class="option"
            :class="{ selected: answers[question.key] === o.value }"
          >
            <input
              v-model="answers[question.key]"
              type="radio"
              :name="question.key"
              :value="o.value"
            >
            <span class="option-label">{{ o.label }}</span>
            <span class="option-desc">{{ o.desc }}</span>
          </label>
        </div>
      </fieldset>
      <div class="quiz-actions">
        <button v-if="step > 0" type="button" class="btn btn-secondary btn-lg" @click="back">Back</button>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="!canContinue">{{ nextLabel }}</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.quiz { max-width: 760px; margin: 0 auto; }
.quiz-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.progress { list-style: none; display: flex; gap: 6px; padding: 0; margin: 0; flex-wrap: wrap; }
.progress li {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 500; color: var(--color-muted);
  padding: 4px 10px 4px 4px; border-radius: 999px; border: 1px solid var(--color-divider);
}
.progress-n {
  width: 20px; height: 20px; display: grid; place-items: center; border-radius: 50%;
  font-family: var(--font-heading); font-weight: 700; font-size: 12px;
  background: var(--color-surface); color: var(--color-text);
}
.progress li.current { color: var(--color-text); border-color: var(--color-primary); }
.progress li.current .progress-n, .progress li.done .progress-n { background: var(--color-primary); color: var(--color-on-primary); }
.skip-link { font-size: 14px; }

.quiz-card {
  background: var(--color-card); border: 1px solid var(--color-divider);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 28px;
}
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
h1 { font-size: clamp(30px, 5vw, 42px); margin-bottom: 20px; }
h1:focus { outline: none; }
.options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.option {
  position: relative; display: flex; flex-direction: column; gap: 2px; cursor: pointer;
  padding: 14px 16px; border-radius: var(--radius-md);
  background: var(--color-bg); border: 1px solid var(--color-divider);
  transition: border-color .15s, background-color .15s;
}
.option:hover { border-color: color-mix(in srgb, var(--color-text) 45%, transparent); }
.option.selected { border-color: var(--color-primary); background: var(--color-highlight); box-shadow: inset 0 0 0 1px var(--color-primary); }
.option input { position: absolute; opacity: 0; width: 0; height: 0; }
.option:has(input:focus-visible) { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.option-label { font-family: var(--font-heading); font-weight: 600; font-size: 19px; line-height: 1.2; }
.option-desc { font-size: 14px; color: var(--color-muted); }
.quiz-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.btn:disabled { opacity: .45; cursor: not-allowed; }

@media (max-width: 640px) {
  .quiz-card { padding: 20px 16px; }
  .options { grid-template-columns: 1fr; }
  .progress li { padding-right: 8px; }
  .quiz-actions .btn { flex: 1; }
}
</style>
