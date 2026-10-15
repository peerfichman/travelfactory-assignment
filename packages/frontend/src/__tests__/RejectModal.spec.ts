import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import RejectModal from '../components/RejectModal.vue';

describe('RejectModal', () => {
  it('shows error and does not emit confirm when textarea is empty', async () => {
    const wrapper = mount(RejectModal, { props: { requestId: 'req-1' } });

    await wrapper.findAll('button')[1].trigger('click'); // Confirm Reject

    expect(wrapper.emitted('confirm')).toBeFalsy();
    expect(wrapper.text()).toContain('A comment is required');
  });

  it('emits confirm with requestId and trimmed comment on valid submission', async () => {
    const wrapper = mount(RejectModal, { props: { requestId: 'req-7' } });

    await wrapper.find('textarea').setValue('  Capacity full  ');
    await wrapper.findAll('button')[1].trigger('click'); // Confirm Reject

    expect(wrapper.emitted('confirm')).toBeTruthy();
    expect(wrapper.emitted('confirm')![0]).toEqual(['req-7', 'Capacity full']);
  });

  it('emits cancel when Cancel button is clicked', async () => {
    const wrapper = mount(RejectModal, { props: { requestId: 'req-1' } });

    await wrapper.findAll('button')[0].trigger('click'); // Cancel

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('confirm')).toBeFalsy();
  });

  it('does not emit confirm when comment is only whitespace', async () => {
    const wrapper = mount(RejectModal, { props: { requestId: 'req-1' } });

    await wrapper.find('textarea').setValue('   ');
    await wrapper.findAll('button')[1].trigger('click');

    expect(wrapper.emitted('confirm')).toBeFalsy();
    expect(wrapper.text()).toContain('A comment is required');
  });
});
