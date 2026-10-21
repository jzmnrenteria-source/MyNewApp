<script setup>
import { computed, ref, watch } from 'vue'
import { supabase } from '../shared/supabase.js'
import { auth, signInUrl } from '../shared/auth.js'

const props = defineProps({ gym: { type: Object, required: true } })

const kind = ref(props.gym.offersDayPass ? 'day_pass' : 'question')
const name = ref('')
const email = ref('')
const message = ref('')
const status = ref('idle') // idle | sending | sent | error
const error = ref('')

watch(() => auth.user?.email, (e) => { if (e && !email.value) email.value = e }, { immediate: true })
// The page first renders with the built-in gym list; follow the live details when they arrive.
watch(() => props.gym.offersDayPass, (offers) => { kind.value = offers ? 'day_pass' : 'question' })

const canSend = computed(() => name.value.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value) && status.value !== 'sending')

async function send() {
  if (!canSend.value) return
  status.value = 'sending'
  error.value = ''
  const { error: err } = await supabase.from('leads').insert({
    gym_id: props.gym.id,
    kind: kind.value,
    name: name.value.trim(),
    email: email.value.trim(),
    message: message.value.trim() || null,
  })
  if (err) {
    status.value = 'error'
    error.value = err.message.includes('limit') ? err.message : 'Your message couldn’t be sent. Please try again.'
  } else {
    status.value = 'sent'
  }
}
</script>

<template>
  <section class="contact" aria-labelledby="contact-title">
    <h2 id="contact-title" class="section-title">Contact {{ gym.name }}</h2>

    <p v-if="!supabase" class="muted">Messaging isn’t available right now.</p>

    <template v-else-if="!auth.user">
      <p class="muted">
        Sign in to {{ gym.offersDayPass ? 'request a free day pass or ' : '' }}ask {{ gym.name }} a question.
        Your message goes to the gym’s owner once they’ve claimed their listing.
      </p>
      <a :href="signInUrl()" class="btn btn-primary">Sign in to contact</a>
    </template>

    <p v-else-if="status === 'sent'" class="sent" role="status">
      Sent. The gym will reply to {{ email }}. You can see your messages on your <a href="/account/">account page</a>.
    </p>

    <form v-else class="contact-form" @submit.prevent="send">
      <div v-if="gym.offersDayPass" class="field">
        <span class="field-label" id="kind-label">What would you like?</span>
        <div class="seg" role="radiogroup" aria-labelledby="kind-label">
          <label><input v-model="kind" type="radio" value="day_pass"> Free day pass</label>
          <label><input v-model="kind" type="radio" value="question"> Ask a question</label>
        </div>
      </div>
      <div class="row">
        <label class="field">
          <span class="field-label">Your name</span>
          <input v-model="name" class="input" maxlength="80" autocomplete="name" required>
        </label>
        <label class="field">
          <span class="field-label">Email for the reply</span>
          <input v-model="email" class="input" type="email" maxlength="200" autocomplete="email" required>
        </label>
      </div>
      <label class="field">
        <span class="field-label">Message (optional)</span>
        <textarea v-model="message" class="input" rows="3" maxlength="1000"
          :placeholder="kind === 'day_pass' ? 'e.g. Hoping to visit Saturday morning' : 'e.g. Do you have squat racks?'"></textarea>
      </label>
      <p v-if="!gym.ownerId" class="muted small">This gym hasn’t claimed its listing yet. We’ll pass your message on once they do.</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="!canSend">
        {{ status === 'sending' ? 'Sending…' : kind === 'day_pass' ? 'Request day pass' : 'Send question' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.contact { padding: 20px; border-radius: var(--radius-md); background: var(--color-card); border: 1px solid var(--color-divider); }
.contact-form { display: grid; gap: 12px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: grid; gap: 5px; }
.field-label { font-size: 13px; color: var(--color-muted); }
.seg { display: inline-flex; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; width: fit-content; }
.seg label { display: inline-flex; gap: 6px; align-items: center; padding: 7px 12px; cursor: pointer; font-size: 14px; }
.seg label + label { border-left: 1px solid var(--color-divider); }
.seg label:has(input:checked) { background: var(--color-primary); color: var(--color-on-primary); }
.seg input { position: absolute; opacity: 0; width: 0; height: 0; }
.seg label:has(input:focus-visible) { outline: 2px solid var(--color-accent); outline-offset: -2px; }
.sent { margin: 0; padding: 14px; border-radius: var(--radius-md); background: var(--color-best); }
.error { margin: 0; color: var(--color-error); font-weight: 500; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.contact-form .btn { justify-self: start; }
@media (max-width: 640px) { .row { grid-template-columns: 1fr; } }
</style>
