import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../components/StatusBadge.vue';

describe('StatusBadge', () => {
  it('renders Pending with yellow styles', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'Pending' } });
    expect(wrapper.text()).toBe('Pending');
    expect(wrapper.classes()).toContain('bg-yellow-100');
  });

  it('renders Approved with green styles', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'Approved' } });
    expect(wrapper.classes()).toContain('bg-green-100');
  });

  it('renders Rejected with red styles', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'Rejected' } });
    expect(wrapper.classes()).toContain('bg-red-100');
  });
});
