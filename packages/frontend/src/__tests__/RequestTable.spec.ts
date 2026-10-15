import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import RequestTable from '../components/RequestTable.vue';
import type { VacationRequest } from '../services/vacation.service';

function makeRequest(overrides: Partial<VacationRequest> = {}): VacationRequest {
  return {
    id: 'req-1',
    user_id: 'user-1',
    start_date: '2027-06-01',
    end_date: '2027-06-07',
    reason: null,
    status: 'Pending',
    comments: null,
    created_at: '2027-01-01T00:00:00Z',
    updated_at: '2027-01-01T00:00:00Z',
    user: { id: 'user-1', name: 'Alice Martin', email: 'alice@example.com' },
    ...overrides,
  };
}

describe('RequestTable', () => {
  it('renders empty state when requests prop is empty', () => {
    const wrapper = mount(RequestTable, { props: { requests: [] } });
    expect(wrapper.text()).toContain('No requests found');
  });

  it('renders one row per request', () => {
    const requests = [makeRequest({ id: 'r1' }), makeRequest({ id: 'r2' })];
    const wrapper = mount(RequestTable, { props: { requests } });
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
  });

  it('renders employee name in each row', () => {
    const wrapper = mount(RequestTable, { props: { requests: [makeRequest()] } });
    expect(wrapper.text()).toContain('Alice Martin');
  });

  it('shows Approve and Reject buttons for Pending requests', () => {
    const wrapper = mount(RequestTable, {
      props: { requests: [makeRequest({ status: 'Pending' })] },
    });
    expect(wrapper.find('button').text()).toContain('Approve');
    expect(wrapper.findAll('button')[1].text()).toContain('Reject');
  });

  it('shows dash in Actions column for non-Pending requests', () => {
    const wrapper = mount(RequestTable, {
      props: { requests: [makeRequest({ status: 'Approved' })] },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits approve event with correct id when Approve is clicked', async () => {
    const wrapper = mount(RequestTable, {
      props: { requests: [makeRequest({ id: 'req-42', status: 'Pending' })] },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('approve')).toBeTruthy();
    expect(wrapper.emitted('approve')![0]).toEqual(['req-42']);
  });

  it('emits reject event with correct id when Reject is clicked', async () => {
    const wrapper = mount(RequestTable, {
      props: { requests: [makeRequest({ id: 'req-99', status: 'Pending' })] },
    });
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('reject')).toBeTruthy();
    expect(wrapper.emitted('reject')![0]).toEqual(['req-99']);
  });
});
