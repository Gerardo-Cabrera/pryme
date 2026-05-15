import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AppointmentStatusBadge from './AppointmentStatusBadge.vue';

const NOW = new Date('2026-04-08T14:00:00Z').getTime();

describe('AppointmentStatusBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the human-readable label for a hyphenated status', () => {
    const wrapper = mount(AppointmentStatusBadge, {
      props: { status: 'checked-in', appointmentTime: '2026-04-08T15:00:00Z' },
    });

    expect(wrapper.text()).toBe('Checked In');
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('Appointment status: Checked In');
    expect(wrapper.classes()).toContain('badge--checked-in');
  });

  it('adds " - Soon" when scheduled within the 15-minute window', () => {
    const wrapper = mount(AppointmentStatusBadge, {
      props: { status: 'scheduled', appointmentTime: '2026-04-08T14:10:00Z' },
    });

    expect(wrapper.text()).toBe('Scheduled - Soon');
    expect(wrapper.attributes('aria-label')).toContain('Soon');
  });

  it('does not add "Soon" outside the window', () => {
    const wrapper = mount(AppointmentStatusBadge, {
      props: { status: 'scheduled', appointmentTime: '2026-04-08T14:30:00Z' },
    });

    expect(wrapper.text()).toBe('Scheduled');
  });

  it('does not add "Soon" for non-scheduled statuses', () => {
    const wrapper = mount(AppointmentStatusBadge, {
      props: { status: 'in-progress', appointmentTime: '2026-04-08T14:05:00Z' },
    });

    expect(wrapper.text()).toBe('In Progress');
  });

  it('emits click with the status string', async () => {
    const wrapper = mount(AppointmentStatusBadge, {
      props: { status: 'completed', appointmentTime: '2026-04-08T13:00:00Z' },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')?.[0]).toEqual(['completed']);
  });

  it('compact mode hides the text and exposes a title tooltip', () => {
    const wrapper = mount(AppointmentStatusBadge, {
      props: {
        status: 'no-show',
        appointmentTime: '2026-04-08T13:00:00Z',
        compact: true,
      },
    });

    expect(wrapper.text()).toBe('');
    expect(wrapper.attributes('title')).toBe('No Show');
    expect(wrapper.classes()).toContain('badge--compact');
  });

  it('activates via Enter key', async () => {
    const wrapper = mount(AppointmentStatusBadge, {
      props: { status: 'cancelled', appointmentTime: '2026-04-08T13:00:00Z' },
    });

    await wrapper.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('click')?.[0]).toEqual(['cancelled']);
  });
});
