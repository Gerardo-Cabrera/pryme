# Part 3 — Patient search list review

Notes I'd leave on this PR. There are at least eight things worth fixing; the
first three are blockers.

## 1. `v-html="patient.notes"` is an XSS hole

Patient notes are user-supplied content rendered as raw HTML. Anyone who can
edit a record can drop `<script>` or `<img onerror>` in there and execute JS in
the next user's session — which in a healthcare app is a session-hijacking /
PHI-leak path.

Use the default mustache so it's escaped:

```vue
<span class="patient__notes">{{ patient.notes }}</span>
```

If rich text is genuinely needed, sanitize server-side (DOMPurify with a
whitelist) and store the sanitized HTML — don't sanitize in the template.

## 2. Clicking "Delete" also selects the row

The `<li>` has `@click="selectPatient(...)"` and the `<button>` inside it has
`@click="deletePatient(...)"`. The button click bubbles, so the parent emits
both `delete` and `select` for an entity that's about to disappear.

Stop propagation and add a confirm — deleting a patient is destructive:

```vue
<button type="button" @click.stop="confirmDelete(patient)">Delete</button>
```

## 3. Missing `:key` on `v-for`

Without a key Vue patches in place. As soon as the list is filtered, reordered
or an item is removed you get the wrong DOM reused (and any child state goes
with it).

```vue
<li v-for="patient in filteredPatients" :key="patient.id">…</li>
```

## 4. The search input has no accessible name

A `placeholder` is not a label — it's announced as the value, not the field
name, and it vanishes on focus.

```vue
<label for="patient-search" class="visually-hidden">Search patients</label>
<input id="patient-search" v-model="search" type="search" placeholder="Search patients…" />
```

Also `type="search"` for the clear-button affordance.

## 5. Keyboard users can't activate a row

A clickable `<li>` is not focusable and doesn't respond to Enter/Space. The
fix isn't `tabindex="0"` + a custom keydown — use the right element:

```vue
<li :key="patient.id" class="patient">
  <button type="button" @click="selectPatient(patient.id)">
    {{ patient.first_name }} {{ patient.last_name ?? '' }}
  </button>
  <button type="button" @click.stop="confirmDelete(patient)">Delete</button>
</li>
```

The browser handles focus, semantics and activation for free.

## 6. The filter throws on null data

- `props.patients.filter(...)` blows up if `patients` is `null`/`undefined`
  (e.g. while the API call is in flight).
- `p.first_name.toLowerCase()` blows up if `first_name` is null.
- It only matches `first_name` even though `last_name` is shown next to it —
  searching "smith" finds nothing.

```ts
const props = withDefaults(
  defineProps<{ patients?: Patient[] }>(),
  { patients: () => [] },
);

const norm = (s?: string | null) => (s ?? '').toLowerCase();

const filteredPatients = computed(() => {
  const q = norm(search.value).trim();
  if (!q) return props.patients;
  return props.patients.filter(
    (p) => norm(p.first_name).includes(q) || norm(p.last_name).includes(q),
  );
});
```

## 7. Inline styles

`style="color: #333; cursor: pointer;"` hard-codes a color that won't honor
dark mode, high-contrast, or any design token. Move it to a class.

## 8. No TypeScript / untyped props

`defineProps({ patients: Array })` is a runtime validator, so the item type is
effectively `any`. The brief says the portal/kiosk use TS — match it:

```ts
interface Patient {
  id: number | string;
  first_name: string;
  last_name?: string | null;
  notes?: string | null;
}
```

---

## Refactored component

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';

interface Patient {
  id: number | string;
  first_name: string;
  last_name?: string | null;
  notes?: string | null;
}

const props = withDefaults(
  defineProps<{ patients?: Patient[] }>(),
  { patients: () => [] },
);

const emit = defineEmits<{
  (e: 'select', id: Patient['id']): void;
  (e: 'delete', id: Patient['id']): void;
}>();

const search = ref('');
const norm = (s?: string | null) => (s ?? '').toLowerCase();

const filteredPatients = computed(() => {
  const q = norm(search.value).trim();
  if (!q) return props.patients;
  return props.patients.filter(
    (p) => norm(p.first_name).includes(q) || norm(p.last_name).includes(q),
  );
});

function selectPatient(id: Patient['id']) {
  emit('select', id);
}

function confirmDelete(p: Patient) {
  if (window.confirm(`Delete ${p.first_name} ${p.last_name ?? ''}?`)) {
    emit('delete', p.id);
  }
}
</script>

<template>
  <div class="patient-list">
    <label for="patient-search" class="visually-hidden">Search patients</label>
    <input
      id="patient-search"
      v-model="search"
      type="search"
      placeholder="Search patients…"
    />

    <ul class="patient-list__items" role="list">
      <li
        v-for="patient in filteredPatients"
        :key="patient.id"
        class="patient"
      >
        <button
          type="button"
          class="patient__select"
          @click="selectPatient(patient.id)"
        >
          {{ patient.first_name }} {{ patient.last_name ?? '' }}
        </button>

        <span v-if="patient.notes" class="patient__notes">
          {{ patient.notes }}
        </span>

        <button
          type="button"
          class="patient__delete"
          :aria-label="`Delete ${patient.first_name} ${patient.last_name ?? ''}`"
          @click.stop="confirmDelete(patient)"
        >
          Delete
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.patient-list__items { list-style: none; padding: 0; margin: 0; }
.patient {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text, #333);
}
.patient__select {
  flex: 1;
  text-align: left;
  background: none;
  border: 0;
  padding: 0.5rem;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.patient__select:focus-visible,
.patient__delete:focus-visible {
  outline: 2px solid var(--color-focus, #2563eb);
  outline-offset: 2px;
}
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
```
