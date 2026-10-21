<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { supabase } from '../shared/supabase.js'
import { auth, signInUrl } from '../shared/auth.js'
import { fromRow, gyms } from '../shared/gyms.js'
import { areaLabel, gymUrl } from '../shared/format.js'

const owned = ref([])     // gyms this account owns, with an editable copy
const leads = ref([])
const requests = ref([])
const loading = ref(true)

const req = reactive({ listed: 'yes', gymId: '', gymName: '', gymAddress: '', role: '', message: '' })
const reqStatus = ref('idle')
const reqError = ref('')

const EDITABLE = ['description', 'hours', 'priceNote', 'website', 'phone', 'offersDayPass']
const COLUMN = { priceNote: 'price_note', offersDayPass: 'offers_day_pass' }

async function load() {
  loading.value = true
  const [g, r] = await Promise.all([
    supabase.from('gyms').select('*').eq('owner_id', auth.user.id).order('name'),
    supabase.from('owner_requests').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }),
  ])
  owned.value = (g.data ?? []).map((row) => {
    const gym = fromRow(row)
    return { gym, form: Object.fromEntries(EDITABLE.map((k) => [k, gym[k] ?? (k === 'offersDayPass' ? false : '')])), status: 'idle', error: '' }
  })
  requests.value = r.data ?? []
  if (owned.value.length) {
    const { data } = await supabase.from('leads').select('*').in('gym_id', owned.value.map((o) => o.gym.id)).order('created_at', { ascending: false }).limit(200)
    leads.value = data ?? []
  }
  loading.value = false
}

watch(() => auth.ready && auth.user?.id, (id) => { if (id && supabase) load() }, { immediate: true })

async function saveGym(o) {
  o.status = 'saving'
  o.error = ''
  if (o.form.website && !/^https:\/\//.test(o.form.website)) {
    o.status = 'idle'
    o.error = 'Website must start with https://'
    return
  }
  const patch = Object.fromEntries(EDITABLE.map((k) => [COLUMN[k] ?? k, typeof o.form[k] === 'string' ? o.form[k].trim() || null : o.form[k]]))
  const { error } = await supabase.from('gyms').update(patch).eq('id', o.gym.id)
  o.status = error ? 'idle' : 'saved'
  o.error = error ? 'Couldn’t save. Check the fields and try again.' : ''
  if (!error) setTimeout(() => { if (o.status === 'saved') o.status = 'idle' }, 2500)
}

const claimable = computed(() => {
  const mine = new Set(owned.value.map((o) => o.gym.id))
  return gyms.value.filter((g) => !mine.has(g.id)).sort((a, b) => a.name.localeCompare(b.name))
})
const pendingFor = (gymId) => requests.value.some((r) => r.gym_id === gymId && r.status === 'pending')
const canRequest = computed(() =>
  req.role.trim().length >= 2 && (req.listed === 'yes' ? req.gymId && !pendingFor(req.gymId) : req.gymName.trim().length >= 2),
)

async function sendRequest() {
  if (!canRequest.value) return
  reqStatus.value = 'sending'
  reqError.value = ''
  const row = req.listed === 'yes'
    ? { gym_id: req.gymId, role: req.role.trim(), message: req.message.trim() || null }
    : { gym_name: req.gymName.trim(), gym_address: req.gymAddress.trim() || null, role: req.role.trim(), message: req.message.trim() || null }
  const { error } = await supabase.from('owner_requests').insert(row)
  if (error) {
    reqStatus.value = 'idle'
    reqError.value = 'Couldn’t send your request. Please try again.'
    return
  }
  reqStatus.value = 'sent'
  Object.assign(req, { gymId: '', gymName: '', gymAddress: '', message: '' })
  load()
}

const gymName = (id) => gyms.value.find((g) => g.id === id)?.name ?? owned.value.find((o) => o.gym.id === id)?.gym.name ?? id
const leadsFor = (id) => leads.value.filter((l) => l.gym_id === id)
const date = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
</script>

<template>
  <header class="owner-head">
    <span class="kicker">For gym owners</span>
    <h1 class="page-title">Manage your gym on FitQuest</h1>
    <p class="muted">Claim your listing, keep your details current and reply to people who want to visit.</p>
  </header>

  <p v-if="!supabase" class="empty">Owner tools aren’t available right now.</p>
  <p v-else-if="!auth.ready" class="muted" role="status">Loading…</p>

  <div v-else-if="!auth.user" class="empty">
    <p>Sign in to claim your gym or manage your listing. Listing is free.</p>
    <a :href="signInUrl()" class="btn btn-primary">Sign in</a>
  </div>

  <template v-else>
    <p v-if="loading" class="muted" role="status">Loading your gyms…</p>

    <section v-for="o in owned" :key="o.gym.id" class="gym-box" :aria-labelledby="`g-${o.gym.id}`">
      <div class="gym-box-head">
        <div>
          <h2 :id="`g-${o.gym.id}`" class="section-title">{{ o.gym.name }}</h2>
          <p class="muted small">{{ areaLabel(o.gym.area) }} · {{ o.gym.published ? 'Live on FitQuest' : 'Hidden by FitQuest' }}
            · <a :href="gymUrl(o.gym.id)">View listing</a></p>
        </div>
      </div>

      <form class="edit" @submit.prevent="saveGym(o)">
        <label class="field span-2">
          <span class="field-label">About your gym</span>
          <textarea v-model="o.form.description" class="input" rows="4" maxlength="1000" placeholder="What makes your gym different? Equipment, classes, coaches, vibe."></textarea>
        </label>
        <label class="field">
          <span class="field-label">Opening hours</span>
          <textarea v-model="o.form.hours" class="input" rows="3" maxlength="300" placeholder="Mon–Fri 5am–10pm&#10;Sat–Sun 7am–8pm"></textarea>
        </label>
        <label class="field">
          <span class="field-label">Pricing</span>
          <textarea v-model="o.form.priceNote" class="input" rows="3" maxlength="300" placeholder="e.g. Monthly from $65, no contract. Day pass $20."></textarea>
        </label>
        <label class="field">
          <span class="field-label">Website</span>
          <input v-model="o.form.website" class="input" type="url" maxlength="300" placeholder="https://">
        </label>
        <label class="field">
          <span class="field-label">Phone</span>
          <input v-model="o.form.phone" class="input" type="tel" maxlength="40">
        </label>
        <label class="check span-2">
          <input v-model="o.form.offersDayPass" type="checkbox"> We offer a free day pass to FitQuest visitors
        </label>
        <p class="muted small span-2">Name, address, price level and training styles are checked by FitQuest. Need them changed? Email us and we’ll update them.</p>
        <div class="span-2 save-row">
          <button type="submit" class="btn btn-primary" :disabled="o.status === 'saving'">{{ o.status === 'saving' ? 'Saving…' : 'Save details' }}</button>
          <span v-if="o.status === 'saved'" role="status" class="saved-msg">Saved</span>
          <span v-if="o.error" role="alert" class="error">{{ o.error }}</span>
        </div>
      </form>

      <h3 class="sub-title">Messages ({{ leadsFor(o.gym.id).length }})</h3>
      <p v-if="!leadsFor(o.gym.id).length" class="muted">No messages yet. They’ll appear here when someone contacts you from your listing.</p>
      <ul v-else class="leads">
        <li v-for="l in leadsFor(o.gym.id)" :key="l.id" class="lead">
          <div class="lead-top">
            <strong>{{ l.name }}</strong>
            <span class="chip" :class="l.kind === 'day_pass' ? 'chip-green' : 'chip-blue'">{{ l.kind === 'day_pass' ? 'Day pass' : 'Question' }}</span>
            <span class="muted small">{{ date(l.created_at) }}</span>
          </div>
          <p v-if="l.message" class="lead-msg">{{ l.message }}</p>
          <a :href="`mailto:${l.email}?subject=${encodeURIComponent(`Your FitQuest message to ${o.gym.name}`)}`">Reply to {{ l.email }}</a>
        </li>
      </ul>
    </section>

    <section class="gym-box" aria-labelledby="claim-title">
      <h2 id="claim-title" class="section-title">{{ owned.length ? 'Add another gym' : 'Claim or add your gym' }}</h2>
      <p v-if="reqStatus === 'sent'" class="sent" role="status">Thanks. We’ll review your request and let you know. It usually takes a day or two.</p>
      <form class="edit" @submit.prevent="sendRequest">
        <fieldset class="field span-2 radios">
          <legend class="field-label">Is your gym already on FitQuest?</legend>
          <label class="check"><input v-model="req.listed" type="radio" value="yes"> Yes, it’s listed</label>
          <label class="check"><input v-model="req.listed" type="radio" value="no"> No, add it</label>
        </fieldset>
        <label v-if="req.listed === 'yes'" class="field span-2">
          <span class="field-label">Your gym</span>
          <select v-model="req.gymId" class="input" required>
            <option value="" disabled>Choose your gym</option>
            <option v-for="g in claimable" :key="g.id" :value="g.id" :disabled="pendingFor(g.id)">
              {{ g.name }} ({{ areaLabel(g.area) }}){{ pendingFor(g.id) ? ' · request pending' : '' }}
            </option>
          </select>
        </label>
        <template v-else>
          <label class="field">
            <span class="field-label">Gym name</span>
            <input v-model="req.gymName" class="input" maxlength="120" required>
          </label>
          <label class="field">
            <span class="field-label">Address</span>
            <input v-model="req.gymAddress" class="input" maxlength="200">
          </label>
        </template>
        <label class="field">
          <span class="field-label">Your role</span>
          <input v-model="req.role" class="input" maxlength="80" required placeholder="e.g. Owner, General manager">
        </label>
        <label class="field">
          <span class="field-label">Anything we should know? (optional)</span>
          <input v-model="req.message" class="input" maxlength="1000" placeholder="e.g. Best number to verify you">
        </label>
        <p v-if="reqError" class="error span-2" role="alert">{{ reqError }}</p>
        <div class="span-2">
          <button type="submit" class="btn btn-primary" :disabled="!canRequest || reqStatus === 'sending'">
            {{ reqStatus === 'sending' ? 'Sending…' : 'Send request' }}
          </button>
        </div>
      </form>

      <template v-if="requests.length">
        <h3 class="sub-title">Your requests</h3>
        <ul class="rows">
          <li v-for="r in requests" :key="r.id">
            <span>{{ r.gym_id ? gymName(r.gym_id) : r.gym_name }}</span>
            <span class="status" :class="r.status">{{ r.status }}</span>
          </li>
        </ul>
      </template>
    </section>
  </template>
</template>

<style scoped>
.owner-head { margin-bottom: 20px; }
.owner-head p { margin: 0; }
.gym-box { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); padding: 22px; margin-bottom: 18px; }
.section-title { font-size: 24px; margin-bottom: 4px; }
.sub-title { font-size: 19px; margin: 22px 0 10px; }
.edit { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin-top: 14px; }
.span-2 { grid-column: span 2; }
.field { display: grid; gap: 5px; min-width: 0; }
fieldset.field { border: 0; padding: 0; margin: 0; }
.radios { display: flex; gap: 18px; flex-wrap: wrap; }
.radios legend { width: 100%; margin-bottom: 4px; }
.field-label { font-size: 13px; color: var(--color-muted); }
.check { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.check input { width: 17px; height: 17px; accent-color: var(--color-primary); }
.save-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.saved-msg { color: var(--color-text); font-weight: 600; }
.error { margin: 0; color: var(--color-error); font-weight: 500; }
.sent { padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-best); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.leads { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.lead { padding: 14px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-bg); }
.lead-top { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.lead-msg { margin: 8px 0; white-space: pre-line; overflow-wrap: anywhere; }
.rows { list-style: none; padding: 0; margin: 0; border: 1px solid var(--color-divider); border-radius: var(--radius-md); }
.rows li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; }
.rows li + li { border-top: 1px solid var(--color-divider); }
.status { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px; border-radius: 999px; color: var(--color-on-chip); background: var(--chip-yellow); }
.status.approved { background: var(--chip-green); }
.status.rejected { background: var(--color-surface); color: var(--color-text); }
@media (max-width: 640px) {
  .edit { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>
