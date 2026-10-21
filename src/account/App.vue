<script setup>
import { computed, ref, watch } from 'vue'
import { supabase } from '../shared/supabase.js'
import { auth, sendSignInLink, signOut, takeNext } from '../shared/auth.js'
import { gyms } from '../shared/gyms.js'
import { state } from '../shared/store.js'
import { gymUrl } from '../shared/format.js'

const params = new URLSearchParams(window.location.search)
const next = params.get('next')
const email = ref('')
const status = ref('idle') // idle | sending | sent | error
const error = ref('')
const leads = ref([])
const requests = ref([])

// Supabase puts sign-in errors (e.g. an expired link) in the URL hash.
const hash = new URLSearchParams(window.location.hash.slice(1))
if (hash.get('error_description')) {
  error.value = hash.get('error_description').includes('expired')
    ? 'That sign-in link has expired. Enter your email to get a new one.'
    : 'That sign-in link didn’t work. Enter your email to get a new one.'
  status.value = 'error'
}

const gymName = (id) => gyms.value.find((g) => g.id === id)?.name ?? id

async function submit() {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    status.value = 'error'
    error.value = 'Enter a valid email address.'
    return
  }
  status.value = 'sending'
  error.value = ''
  try {
    await sendSignInLink(email.value.trim(), next)
    status.value = 'sent'
  } catch (e) {
    status.value = 'error'
    error.value = /rate|seconds/i.test(e.message)
      ? 'Too many sign-in emails. Wait a minute and try again.'
      : 'We couldn’t send the email. Check the address and try again.'
  }
}

async function loadActivity() {
  const [l, r] = await Promise.all([
    supabase.from('leads').select('id, gym_id, kind, created_at').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('owner_requests').select('id, gym_id, gym_name, status, created_at').eq('user_id', auth.user.id).order('created_at', { ascending: false }),
  ])
  leads.value = l.data ?? []
  requests.value = r.data ?? []
}

// Back from the emailed link: go where the visitor was headed, or show the account.
watch(() => auth.ready && auth.user, (signedIn) => {
  if (!signedIn) return
  const dest = takeNext()
  if (dest) window.location.replace(dest)
  else loadActivity()
}, { immediate: true })

const date = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const savedCount = computed(() => state.saved.length)
</script>

<template>
  <div class="account">
    <p v-if="!auth.ready" class="muted" role="status">Loading…</p>

    <section v-else-if="!auth.user" class="signin card-box" aria-labelledby="signin-title">
      <span class="kicker">Account</span>
      <h1 id="signin-title" class="page-title">Sign in to FitQuest</h1>
      <template v-if="status === 'sent'">
        <p class="lead-sm" role="status">Check your email. We sent a sign-in link to <strong>{{ email }}</strong>.</p>
        <p class="muted small">The link works once and expires after an hour. Didn’t get it? Check spam, or
          <button type="button" class="link-btn" @click="status = 'idle'">send another</button>.</p>
      </template>
      <template v-else>
        <p class="muted">No password needed. We’ll email you a link that signs you in. Your saved gyms and notes then follow you to any device.</p>
        <p v-if="!supabase" class="error" role="alert">Sign-in isn’t available right now.</p>
        <form v-else class="signin-form" @submit.prevent="submit">
          <label class="field">
            <span class="field-label">Email</span>
            <input v-model="email" class="input" type="email" autocomplete="email" required placeholder="you@example.com">
          </label>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <button type="submit" class="btn btn-primary btn-lg" :disabled="status === 'sending'">
            {{ status === 'sending' ? 'Sending…' : 'Email me a sign-in link' }}
          </button>
        </form>
      </template>
    </section>

    <template v-else>
      <header class="account-head">
        <div>
          <span class="kicker">Account</span>
          <h1 class="page-title">Hi there</h1>
          <p class="muted">Signed in as {{ auth.user.email }}</p>
        </div>
        <button type="button" class="btn btn-secondary" @click="signOut">Sign out</button>
      </header>

      <div class="tiles">
        <a href="/saved/" class="tile">
          <span class="tile-title">Saved gyms</span>
          <span class="muted">{{ savedCount }} saved · synced to your account</span>
        </a>
        <a href="/owner/" class="tile">
          <span class="tile-title">For gym owners</span>
          <span class="muted">Claim your gym, edit its details and see messages</span>
        </a>
        <a v-if="auth.profile?.is_admin" href="/admin/" class="tile tile-admin">
          <span class="tile-title">Admin</span>
          <span class="muted">Approve owners and edit gym listings</span>
        </a>
      </div>

      <section v-if="requests.length" class="activity" aria-labelledby="req-title">
        <h2 id="req-title" class="section-title">Your owner requests</h2>
        <ul class="rows">
          <li v-for="r in requests" :key="r.id">
            <span>{{ r.gym_id ? gymName(r.gym_id) : r.gym_name }}</span>
            <span class="status" :class="r.status">{{ r.status }}</span>
            <span class="muted">{{ date(r.created_at) }}</span>
          </li>
        </ul>
      </section>

      <section class="activity" aria-labelledby="leads-title">
        <h2 id="leads-title" class="section-title">Messages you’ve sent</h2>
        <p v-if="!leads.length" class="muted">None yet. You can request a day pass or ask a question on any gym’s page.</p>
        <ul v-else class="rows">
          <li v-for="l in leads" :key="l.id">
            <a :href="gymUrl(l.gym_id)">{{ gymName(l.gym_id) }}</a>
            <span>{{ l.kind === 'day_pass' ? 'Day pass request' : 'Question' }}</span>
            <span class="muted">{{ date(l.created_at) }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.account { max-width: 760px; margin: 0 auto; }
.card-box { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-md); }
.signin { max-width: 520px; margin: 24px auto; }
.signin-form { display: grid; gap: 12px; margin-top: 8px; }
.field { display: grid; gap: 5px; }
.field-label { font-size: 13px; color: var(--color-muted); }
.lead-sm { font-size: 17px; }
.error { margin: 0; color: var(--color-error); font-weight: 500; }
.link-btn { padding: 0; border: 0; background: none; color: var(--color-link); font: inherit; text-decoration: underline; cursor: pointer; }
.account-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.account-head p { margin: 0; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 28px; }
.tile { display: grid; gap: 4px; padding: 18px; border-radius: var(--radius-md); background: var(--color-card); border: 1px solid var(--color-divider); color: var(--color-text); text-decoration: none; }
.tile:hover { border-color: var(--color-primary); }
.tile-admin { background: var(--color-highlight); }
.tile-title { font: 600 20px var(--font-heading); }
.tile .muted { font-size: 14px; }
.section-title { font-size: 22px; margin-bottom: 10px; }
.activity { margin-bottom: 24px; }
.rows { list-style: none; padding: 0; margin: 0; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-card); }
.rows li { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; padding: 10px 14px; align-items: center; font-size: 15px; }
.rows li + li { border-top: 1px solid var(--color-divider); }
.status { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; border-radius: 999px; color: var(--color-on-chip); background: var(--chip-yellow); }
.status.approved { background: var(--chip-green); }
.status.rejected { background: var(--color-surface); color: var(--color-text); }
</style>
