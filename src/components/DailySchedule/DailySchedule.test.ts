import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import DailySchedule from './DailySchedule.vue';

function mockFetchJson(jsonPayload: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      ({ ok, status, json: async () => jsonPayload }) as unknown as Response,
    ),
  );
}

const props = {
  userId: '1',
  date: '2026-04-08',
  apiUrl: 'http://localhost/api/schedule/daily',
};

describe('DailySchedule', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the list when the API returns a valid array', async () => {
    mockFetchJson([
      { id: 1, patientName: 'Jane Doe', startTime: '09:00', status: 'scheduled' },
      { id: 2, patientName: 'John Roe', startTime: '09:30', status: 'completed' },
    ]);

    const wrapper = mount(DailySchedule, { props });
    await flushPromises();

    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(wrapper.text()).toContain('Jane Doe');
  });

  it('shows the empty state when the array is empty', async () => {
    mockFetchJson([]);

    const wrapper = mount(DailySchedule, { props });
    await flushPromises();

    expect(wrapper.find('ul').exists()).toBe(false);
    expect(wrapper.text()).toContain('No appointments scheduled');
  });

  it('shows an error (and does NOT crash) when the API returns JSON null', async () => {
    mockFetchJson(null);

    const wrapper = mount(DailySchedule, { props });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Malformed schedule response');
  });

  it('shows an error when the API returns a non-array object', async () => {
    mockFetchJson({ not: 'an array' });

    const wrapper = mount(DailySchedule, { props });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('drops items that do not match the Appointment shape', async () => {
    mockFetchJson([
      { id: 1, patientName: 'Jane', startTime: '09:00', status: 'scheduled' },
      { id: 2 }, // malformed
      'not an object',
    ]);

    const wrapper = mount(DailySchedule, { props });
    await flushPromises();

    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.text()).toContain('Jane');
  });

  it('shows an error when the response is not ok', async () => {
    mockFetchJson(null, false, 500);

    const wrapper = mount(DailySchedule, { props });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('500');
  });
});
