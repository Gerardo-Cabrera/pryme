<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface Props {
  userId: string;
  date: string;
  apiUrl: string;
}

const props = defineProps<Props>();

interface Appointment {
  id: number | string;
  patientName: string;
  startTime: string;
  status: string;
}

const appointments = ref<Appointment[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const url = new URL(props.apiUrl, window.location.origin);
    url.searchParams.set('user_id', props.userId);
    url.searchParams.set('date', props.date);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    appointments.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load schedule';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="daily-schedule">
    <p v-if="loading">Loading schedule…</p>
    <p v-else-if="error" role="alert">{{ error }}</p>
    <ul v-else-if="appointments.length" class="daily-schedule__list">
      <li v-for="a in appointments" :key="a.id" class="daily-schedule__item">
        <time :datetime="a.startTime">{{ a.startTime }}</time>
        <span>{{ a.patientName }}</span>
        <span class="daily-schedule__status">{{ a.status }}</span>
      </li>
    </ul>
    <p v-else>No appointments scheduled for {{ date }}.</p>
  </div>
</template>
