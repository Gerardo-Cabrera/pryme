<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

interface Props {
  status: AppointmentStatus;
  appointmentTime: string;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

const emit = defineEmits<{
  (e: 'click', status: AppointmentStatus): void;
}>();

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  'scheduled': 'Scheduled',
  'checked-in': 'Checked In',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'no-show': 'No Show',
};

const SOON_THRESHOLD_MS = 15 * 60 * 1000;

const now = ref(Date.now());
let tick: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  tick = setInterval(() => (now.value = Date.now()), 30_000);
});

onBeforeUnmount(() => {
  if (tick) clearInterval(tick);
});

const isSoon = computed(() => {
  if (props.status !== 'scheduled') return false;
  const target = Date.parse(props.appointmentTime);
  if (Number.isNaN(target)) return false;
  const diff = target - now.value;
  return diff >= 0 && diff <= SOON_THRESHOLD_MS;
});

const displayText = computed(() =>
  isSoon.value ? `${STATUS_LABELS[props.status]} - Soon` : STATUS_LABELS[props.status],
);

const ariaLabel = computed(() => `Appointment status: ${displayText.value}`);

function onClick() {
  emit('click', props.status);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
}
</script>

<template>
  <span
    :class="['badge', `badge--${status}`, { 'badge--compact': compact }]"
    role="status"
    :aria-label="ariaLabel"
    :title="compact ? displayText : undefined"
    tabindex="0"
    @click="onClick"
    @keydown="onKeydown"
  >
    <template v-if="!compact">{{ displayText }}</template>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  cursor: pointer;
  user-select: none;
  outline-offset: 2px;
}

.badge:focus-visible {
  outline: 2px solid #2563eb;
}

.badge--compact {
  padding: 0;
  width: 0.75rem;
  height: 0.75rem;
}

.badge--scheduled   { background-color: #2563eb; }
.badge--checked-in  { background-color: #0d9488; }
.badge--in-progress { background-color: #d97706; }
.badge--completed   { background-color: #16a34a; }
.badge--cancelled   { background-color: #6b7280; }
.badge--no-show     { background-color: #dc2626; }
</style>
