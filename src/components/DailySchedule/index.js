import { createApp } from 'vue';
import DailySchedule from './DailySchedule.vue';

export function mountDailySchedule() {
    const elements = document.querySelectorAll('[data-component="daily-schedule"]');

    elements.forEach((el) => {
        const { userId, date, apiUrl } = el.dataset;
        createApp(DailySchedule, { userId, date, apiUrl }).mount(el);
    });
}
