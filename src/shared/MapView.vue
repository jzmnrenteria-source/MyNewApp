<script setup>
// Leaflet map with one marker per neighborhood. Gyms don't have confirmed
// coordinates yet, so markers sit on neighborhood centers and show a gym count.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  areas: { type: Array, required: true }, // [{ key, label, lat, lng, count }]
  selected: { type: String, default: null },
  label: { type: String, default: 'Map of Miami neighborhoods with gyms' },
})
const emit = defineEmits(['select'])

const el = ref(null)
let map
let layer
let observer
let fitting = false
let userMoved = false

// Neighborhoods close together on screen (e.g. Wynwood and Midtown) would overlap.
// Place labels from top to bottom and nudge each one down until it clears the
// labels already placed. Returns a vertical offset in pixels per area.
const PIN_H = 30
function offsets() {
  const boxes = props.areas.map((a, i) => {
    const p = map.latLngToContainerPoint([a.lat, a.lng])
    const w = 44 + a.label.length * 7.5
    return { i, left: p.x - 15, right: p.x - 15 + w, top: p.y - PIN_H / 2 }
  })
  const placed = []
  const dy = props.areas.map(() => 0)
  for (const b of [...boxes].sort((x, y) => x.top - y.top)) {
    let top = b.top
    let moved = true
    while (moved) {
      moved = false
      for (const o of placed) {
        if (b.left < o.right && b.right > o.left && top < o.top + PIN_H + 2 && top + PIN_H + 2 > o.top) {
          top = o.top + PIN_H + 2
          moved = true
        }
      }
    }
    placed.push({ ...b, top })
    dy[b.i] = Math.round(top - b.top)
  }
  return dy
}

function draw() {
  if (!map) return
  layer.clearLayers()
  const dy = offsets()
  props.areas.forEach((a, i) => {
    const on = a.key === props.selected
    const icon = L.divIcon({
      className: '',
      html: `<span class="fq-pin${on ? ' on' : ''}${a.count ? '' : ' empty'}" style="--dy:${dy[i]}px"><b>${a.count}</b>${a.label}</span>`,
      iconSize: null,
    })
    L.marker([a.lat, a.lng], {
      icon,
      title: `${a.label}: ${a.count} gym${a.count === 1 ? '' : 's'}`,
      alt: `${a.label}: ${a.count} gyms`,
      riseOnHover: true,
      zIndexOffset: on ? 1000 : 0,
    })
      .on('click', () => emit('select', on ? null : a.key))
      .addTo(layer)
  })
}

onMounted(() => {
  // Start over Miami so the map always has a view, even while its box is hidden.
  map = L.map(el.value, { scrollWheelZoom: false, zoomControl: true }).setView([25.77, -80.2], 12)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)
  layer = L.layerGroup().addTo(map)
  fit()
  draw()
  // The map's box can change size after mount (sticky column, mobile list/map toggle):
  // re-measure, and keep the markers framed until the visitor pans or zooms.
  observer = new ResizeObserver(() => {
    map.invalidateSize()
    if (!userMoved) fit()
  })
  map.on('dragend zoomend', () => {
    if (!fitting) userMoved = true
  })
  map.on('zoomend', draw)
  observer.observe(el.value)
})

function fit() {
  const { clientWidth: w, clientHeight: h } = el.value
  if (!w || !h) return
  fitting = true
  if (props.areas.length === 1) map.setView([props.areas[0].lat, props.areas[0].lng], 13, { animate: false })
  else map.fitBounds(L.latLngBounds(props.areas.map((a) => [a.lat, a.lng])), { padding: [40, 40], animate: false })
  fitting = false
  draw()
}

watch(() => [props.areas, props.selected], draw, { deep: true })

// Called by the parent when the map container is shown after being hidden (mobile toggle).
function refresh() {
  map?.invalidateSize()
  if (!userMoved) fit()
}
defineExpose({ refresh })

onBeforeUnmount(() => {
  observer?.disconnect()
  map?.remove()
})
</script>

<template>
  <div ref="el" class="fq-map" role="region" :aria-label="label"></div>
</template>

<style>
.fq-map { width: 100%; height: 100%; min-height: 220px; flex: 1; border-radius: var(--radius-md); border: 1px solid var(--color-divider); z-index: 0; background: var(--color-surface); }
.fq-pin {
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  /* the numbered dot sits on the neighborhood; the name extends to the right.
     --dy nudges a label down when it would overlap a nearby one */
  transform: translate(-15px, calc(-50% + var(--dy, 0px)));
  padding: 4px 9px 4px 4px; border-radius: 999px;
  font: 600 13px/1.2 var(--font-body); color: var(--color-text);
  background: var(--color-card); border: 1px solid var(--color-divider); box-shadow: var(--shadow-md);
  cursor: pointer;
}
.fq-pin b {
  min-width: 22px; height: 22px; display: grid; place-items: center; border-radius: 999px;
  font: 700 13px var(--font-heading); background: var(--color-primary); color: var(--color-on-primary);
}
.fq-pin.on { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary), var(--shadow-md); }
.fq-pin.empty { opacity: .6; }
.fq-pin.empty b { background: var(--color-surface); color: var(--color-muted); }
.leaflet-marker-icon:focus-visible .fq-pin { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.leaflet-container { font-family: var(--font-body); }
.leaflet-container a { color: var(--color-link); }

/* Dark theme: darken the map tiles to match (same two cases as the dark tokens) */
:root[data-theme="dark"] .fq-map .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(.9) contrast(.9); }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .fq-map .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(.9) contrast(.9); }
}
:root[data-theme="dark"] .leaflet-bar a, :root[data-theme="dark"] .leaflet-control-attribution { background: var(--color-card); color: var(--color-text); border-color: var(--color-divider); }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .leaflet-bar a, :root:not([data-theme="light"]) .leaflet-control-attribution { background: var(--color-card); color: var(--color-text); border-color: var(--color-divider); }
}
</style>
