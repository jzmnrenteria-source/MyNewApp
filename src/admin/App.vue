<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { supabase } from '../shared/supabase.js'
import { auth, signInUrl } from '../shared/auth.js'
import { AREAS, TIERS } from '../shared/data.js'
import { QUESTIONS } from '../shared/questions.js'
import { gymUrl } from '../shared/format.js'

const GOALS = QUESTIONS[0].options
const requests = ref([])
const gymRows = ref([])
const leads = ref([])
const emails = ref({}) // user id -> email
const loading = ref(true)
const notice = ref('')
const editing = ref(null) // form object while editing/adding
const formError = ref('')

const isAdmin = computed(() => !!auth.profile?.is_admin)
const pending = computed(() => requests.value.filter((r) => r.status === 'pending'))
const gymName = (id) => gymRows.value.find((g) => g.id === id)?.name ?? id

async function load() {
  loading.value = true
  const [r, g, l] = await Promise.all([
    supabase.from('owner_requests').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('gyms').select('*').order('name'),
    supabase.from('leads').select('id, gym_id, kind, created_at').order('created_at', { ascending: false }).limit(20),
  ])
  requests.value = r.data ?? []
  gymRows.value = g.data ?? []
  leads.value = l.data ?? []
  const ids = [...new Set([...requests.value.map((x) => x.user_id), ...gymRows.value.map((x) => x.owner_id)].filter(Boolean))]
  if (ids.length) {
    const { data } = await supabase.from('profiles').select('id, email').in('id', ids)
    emails.value = Object.fromEntries((data ?? []).map((p) => [p.id, p.email]))
  }
  loading.value = false
}

watch(() => auth.ready && isAdmin.value, (ok) => { if (ok) load() }, { immediate: true })

async function decide(r, approve) {
  const { error } = await supabase.rpc('decide_owner_request', { request_id: r.id, approve })
  if (error) {
    notice.value = `Couldn’t update the request: ${error.message}`
    return
  }
  notice.value = approve
    ? r.gym_id
      ? `Approved. ${emails.value[r.user_id] ?? 'The requester'} now manages ${gymName(r.gym_id)}.`
      : `Approved. Add “${r.gym_name}” below and set ${emails.value[r.user_id] ?? 'the requester'} as its owner.`
    : 'Request rejected.'
  if (approve && !r.gym_id) startAdd({ name: r.gym_name, address: r.gym_address ?? '', ownerEmail: emails.value[r.user_id] ?? '' })
  load()
}

// ── Add / edit a gym ──
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

function toForm(g) {
  return {
    isNew: false, id: g.id, name: g.name, area: g.area, address: g.address ?? '', type: g.type, tier: g.tier,
    goals_primary: [...g.goals_primary], goals_secondary: [...g.goals_secondary], access: g.access,
    coached: g.coached, recovery: g.recovery, community: g.community, source: g.source ?? '',
    verified: g.verified, published: g.published, ownerEmail: emails.value[g.owner_id] ?? '',
  }
}
function startEdit(g) {
  formError.value = ''
  editing.value = reactive(toForm(g))
}
function startAdd(prefill = {}) {
  formError.value = ''
  editing.value = reactive({
    isNew: true, id: '', name: '', area: 'brickell', address: '', type: '', tier: 2,
    goals_primary: [], goals_secondary: [], access: 'open', coached: false, recovery: false, community: false,
    source: '', verified: false, published: true, ownerEmail: '', ...prefill,
  })
}

async function saveGym() {
  const f = editing.value
  formError.value = ''
  if (f.isNew && !f.id) f.id = slug(`${f.name} ${AREAS[f.area].label}`)
  if (!f.name.trim() || !f.type.trim()) return (formError.value = 'Name and type are required.')
  if (f.source && !/^https:\/\//.test(f.source)) return (formError.value = 'Source must start with https://')
  let ownerId = null
  if (f.ownerEmail.trim()) {
    const { data } = await supabase.from('profiles').select('id').eq('email', f.ownerEmail.trim().toLowerCase()).maybeSingle()
    if (!data) return (formError.value = 'No FitQuest account uses that owner email. They need to sign in once first.')
    ownerId = data.id
  }
  const row = {
    name: f.name.trim(), area: f.area, address: f.address.trim() || null, type: f.type.trim(), tier: Number(f.tier),
    goals_primary: f.goals_primary, goals_secondary: f.goals_secondary.filter((x) => !f.goals_primary.includes(x)),
    access: f.access, coached: f.coached, recovery: f.recovery, community: f.community,
    source: f.source.trim() || null, verified: f.verified, published: f.published, owner_id: ownerId,
  }
  const { error } = f.isNew
    ? await supabase.from('gyms').insert({ id: f.id, ...row })
    : await supabase.from('gyms').update(row).eq('id', f.id)
  if (error) return (formError.value = error.code === '23505' ? 'A gym with that ID already exists.' : `Couldn’t save: ${error.message}`)
  notice.value = `${f.isNew ? 'Added' : 'Saved'} ${row.name}.`
  editing.value = null
  load()
}

const date = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
</script>

<template>
  <header class="admin-head">
    <span class="kicker">Admin</span>
    <h1 class="page-title">FitQuest admin</h1>
  </header>

  <p v-if="!supabase" class="empty">Admin tools aren’t available right now.</p>
  <p v-else-if="!auth.ready" class="muted" role="status">Loading…</p>
  <div v-else-if="!auth.user" class="empty">
    <p>Sign in with an admin account.</p>
    <a :href="signInUrl()" class="btn btn-primary">Sign in</a>
  </div>
  <div v-else-if="!isAdmin" class="empty">
    <p>This page is for FitQuest admins. You’re signed in as {{ auth.user.email }}.</p>
    <a href="/account/" class="btn btn-secondary">Your account</a>
  </div>

  <template v-else>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="loading" class="muted" role="status">Loading…</p>

    <section class="box" aria-labelledby="req-title">
      <h2 id="req-title" class="section-title">Owner requests <span class="count">{{ pending.length }} pending</span></h2>
      <p v-if="!pending.length" class="muted">No pending requests.</p>
      <ul v-else class="reqs">
        <li v-for="r in pending" :key="r.id" class="req">
          <div>
            <strong>{{ r.gym_id ? gymName(r.gym_id) : `${r.gym_name} (new gym)` }}</strong>
            <span class="muted"> · {{ r.role }} · {{ emails[r.user_id] ?? 'unknown account' }} · {{ date(r.created_at) }}</span>
            <p v-if="r.gym_address" class="muted small">Address: {{ r.gym_address }}</p>
            <p v-if="r.message" class="req-msg">“{{ r.message }}”</p>
          </div>
          <div class="req-actions">
            <button type="button" class="btn btn-primary btn-sm" @click="decide(r, true)">Approve<span class="sr-only"> {{ emails[r.user_id] }}</span></button>
            <button type="button" class="btn btn-secondary btn-sm" @click="decide(r, false)">Reject<span class="sr-only"> {{ emails[r.user_id] }}</span></button>
          </div>
        </li>
      </ul>
      <p class="muted small">Verify the person actually works at the gym (call the gym’s public number) before approving.</p>
    </section>

    <section class="box" aria-labelledby="gyms-title">
      <div class="box-head">
        <h2 id="gyms-title" class="section-title">Gyms <span class="count">{{ gymRows.length }}</span></h2>
        <button type="button" class="btn btn-secondary btn-sm" @click="startAdd()">+ Add gym</button>
      </div>

      <form v-if="editing" class="edit" @submit.prevent="saveGym" aria-label="Gym details">
        <h3 class="span-3 sub-title">{{ editing.isNew ? 'Add a gym' : `Edit ${editing.name}` }}</h3>
        <label class="field"><span class="field-label">Name</span><input v-model="editing.name" class="input" maxlength="120" required></label>
        <label class="field"><span class="field-label">Neighborhood</span>
          <select v-model="editing.area" class="input"><option v-for="(a, k) in AREAS" :key="k" :value="k">{{ a.label }}</option></select>
        </label>
        <label class="field"><span class="field-label">Address</span><input v-model="editing.address" class="input" maxlength="200"></label>
        <label class="field"><span class="field-label">Type</span><input v-model="editing.type" class="input" maxlength="120" required placeholder="e.g. Boxing gym"></label>
        <label class="field"><span class="field-label">Price level</span>
          <select v-model.number="editing.tier" class="input"><option v-for="(t, k) in TIERS" :key="k" :value="Number(k)">{{ t.symbol }} · {{ t.range }}</option></select>
        </label>
        <label class="field"><span class="field-label">Access</span>
          <select v-model="editing.access" class="input"><option value="open">Open-gym access</option><option value="classes">Scheduled classes</option></select>
        </label>
        <fieldset class="field span-3 checks"><legend class="field-label">Built for</legend>
          <label v-for="g in GOALS" :key="g.value" class="check"><input v-model="editing.goals_primary" type="checkbox" :value="g.value"> {{ g.label }}</label>
        </fieldset>
        <fieldset class="field span-3 checks"><legend class="field-label">Also covers</legend>
          <label v-for="g in GOALS" :key="g.value" class="check"><input v-model="editing.goals_secondary" type="checkbox" :value="g.value" :disabled="editing.goals_primary.includes(g.value)"> {{ g.label }}</label>
        </fieldset>
        <fieldset class="field span-3 checks"><legend class="field-label">Features and status</legend>
          <label class="check"><input v-model="editing.coached" type="checkbox"> Coaching included</label>
          <label class="check"><input v-model="editing.recovery" type="checkbox"> Recovery amenities</label>
          <label class="check"><input v-model="editing.community" type="checkbox"> Class community</label>
          <label class="check"><input v-model="editing.verified" type="checkbox"> Verified by FitQuest</label>
          <label class="check"><input v-model="editing.published" type="checkbox"> Published</label>
        </fieldset>
        <label class="field"><span class="field-label">Source link</span><input v-model="editing.source" class="input" type="url" placeholder="https://"></label>
        <label class="field"><span class="field-label">Owner’s account email</span><input v-model="editing.ownerEmail" class="input" type="email" placeholder="Leave empty for no owner"></label>
        <label v-if="editing.isNew" class="field"><span class="field-label">ID (optional)</span><input v-model="editing.id" class="input" maxlength="60" pattern="[a-z0-9\-]{2,60}" placeholder="made from the name"></label>
        <p v-if="formError" class="error span-3" role="alert">{{ formError }}</p>
        <div class="span-3 form-actions">
          <button type="submit" class="btn btn-primary">{{ editing.isNew ? 'Add gym' : 'Save changes' }}</button>
          <button type="button" class="btn btn-secondary" @click="editing = null">Cancel</button>
        </div>
      </form>

      <div class="table-wrap" tabindex="0" role="region" aria-label="All gyms (scrolls sideways)">
        <table class="gyms">
          <thead><tr><th scope="col">Gym</th><th scope="col">Area</th><th scope="col">Price</th><th scope="col">Status</th><th scope="col">Owner</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            <tr v-for="g in gymRows" :key="g.id">
              <th scope="row"><a :href="gymUrl(g.id)">{{ g.name }}</a></th>
              <td>{{ AREAS[g.area]?.label }}</td>
              <td>{{ TIERS[g.tier]?.symbol }}</td>
              <td>
                <span v-if="!g.published" class="tag">Hidden</span>
                <span v-if="g.verified" class="tag tag-ok">Verified</span>
                <span v-if="g.published && !g.verified" class="muted">Live</span>
              </td>
              <td>{{ emails[g.owner_id] ?? '—' }}</td>
              <td><button type="button" class="btn btn-secondary btn-sm" @click="startEdit(g)">Edit<span class="sr-only"> {{ g.name }}</span></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="box" aria-labelledby="leads-title">
      <h2 id="leads-title" class="section-title">Recent messages to gyms</h2>
      <p v-if="!leads.length" class="muted">None yet.</p>
      <ul v-else class="rows">
        <li v-for="l in leads" :key="l.id">
          <span>{{ gymName(l.gym_id) }}</span>
          <span>{{ l.kind === 'day_pass' ? 'Day pass' : 'Question' }}</span>
          <span class="muted">{{ date(l.created_at) }}</span>
        </li>
      </ul>
      <p class="muted small">Messages to gyms without an owner wait here until someone claims the gym.</p>
    </section>
  </template>
</template>

<style scoped>
.admin-head { margin-bottom: 16px; }
.notice { padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-highlight); }
.box { background: var(--color-card); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 18px; }
.box-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.section-title { font-size: 24px; margin-bottom: 10px; }
.sub-title { font-size: 19px; margin: 0; }
.count { font: 500 14px var(--font-body); color: var(--color-muted); margin-left: 6px; }
.reqs { list-style: none; padding: 0; margin: 0 0 10px; display: grid; gap: 10px; }
.req { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; padding: 14px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-bg); flex-wrap: wrap; }
.req p { margin: 4px 0 0; }
.req-msg { overflow-wrap: anywhere; }
.req-actions { display: flex; gap: 8px; }
.edit { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 16px; margin: 14px 0 20px; padding: 16px; border-radius: var(--radius-md); background: var(--color-bg); border: 1px solid var(--color-divider); }
.span-3 { grid-column: span 3; }
.field { display: grid; gap: 5px; min-width: 0; }
fieldset.field { border: 0; padding: 0; margin: 0; }
.checks { display: flex; flex-wrap: wrap; gap: 6px 16px; }
.checks legend { width: 100%; margin-bottom: 4px; }
.field-label { font-size: 13px; color: var(--color-muted); }
.check { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; font-size: 15px; }
.check input { width: 17px; height: 17px; accent-color: var(--color-primary); }
.form-actions { display: flex; gap: 8px; }
.error { margin: 0; color: var(--color-error); font-weight: 500; }
.table-wrap { position: relative; overflow-x: auto; margin-top: 12px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); }
.table-wrap:focus-visible { outline: 2px solid var(--color-accent); }
.gyms { width: 100%; border-collapse: collapse; min-width: 640px; font-size: 15px; }
.gyms th, .gyms td { padding: 9px 12px; text-align: left; border-bottom: 1px solid var(--color-divider); }
.gyms thead th { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--color-muted); }
.gyms tbody th { font-weight: 600; }
.gyms tbody tr:last-child > * { border-bottom: 0; }
.tag { display: inline-block; font-size: 12px; font-weight: 600; padding: 1px 8px; border-radius: 999px; background: var(--chip-yellow); color: var(--color-on-chip); margin-right: 4px; }
.tag-ok { background: var(--chip-green); }
.rows { list-style: none; padding: 0; margin: 0; border: 1px solid var(--color-divider); border-radius: var(--radius-md); }
.rows li { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; padding: 9px 14px; }
.rows li + li { border-top: 1px solid var(--color-divider); }
@media (max-width: 760px) {
  .edit { grid-template-columns: 1fr; }
  .span-3 { grid-column: span 1; }
}
</style>
