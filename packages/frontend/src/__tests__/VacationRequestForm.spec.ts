import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import VacationRequestForm from '../components/VacationRequestForm.vue';
import { useVacationStore } from '../stores/vacationRequests';

describe('VacationRequestForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders start date, end date inputs and reason textarea', () => {
    const wrapper = mount(VacationRequestForm);
    const dateInputs = wrapper.findAll('input[type="date"]');
    expect(dateInputs).toHaveLength(2);
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('shows error and does not call store when end date is not after start date', async () => {
    const wrapper = mount(VacationRequestForm);
    const store = useVacationStore();
    store.submitRequest = vi.fn();

    const [startInput, endInput] = wrapper.findAll('input[type="date"]');
    await startInput.setValue('2027-06-20');
    await endInput.setValue('2027-06-20'); // same date → invalid

    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('End date must be after start date');
    expect(store.submitRequest).not.toHaveBeenCalled();
  });

  it('calls store.submitRequest and shows success on valid submission', async () => {
    const wrapper = mount(VacationRequestForm);
    const store = useVacationStore();
    store.submitRequest = vi.fn().mockResolvedValue({ id: 'abc' });

    const [startInput, endInput] = wrapper.findAll('input[type="date"]');
    await startInput.setValue('2027-07-01');
    await endInput.setValue('2027-07-10');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(store.submitRequest).toHaveBeenCalledWith({
      startDate: '2027-07-01',
      endDate: '2027-07-10',
      reason: undefined,
    });
    expect(wrapper.text()).toContain('submitted successfully');
  });

  it('resets form fields after successful submission', async () => {
    const wrapper = mount(VacationRequestForm);
    const store = useVacationStore();
    store.submitRequest = vi.fn().mockResolvedValue({ id: 'abc' });

    const [startInput, endInput] = wrapper.findAll('input[type="date"]');
    await startInput.setValue('2027-08-01');
    await endInput.setValue('2027-08-10');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect((startInput.element as HTMLInputElement).value).toBe('');
    expect((endInput.element as HTMLInputElement).value).toBe('');
  });

  it('shows server error message when store throws', async () => {
    const wrapper = mount(VacationRequestForm);
    const store = useVacationStore();
    store.submitRequest = vi.fn().mockRejectedValue({
      response: { data: { error: 'Overlap detected' } },
    });

    const [startInput, endInput] = wrapper.findAll('input[type="date"]');
    await startInput.setValue('2027-09-01');
    await endInput.setValue('2027-09-10');

    await wrapper.find('form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Overlap detected');
  });
});
