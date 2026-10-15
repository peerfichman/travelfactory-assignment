import { EventBus } from '../../src/infrastructure/EventBus';

class OrderCreatedEvent {
  constructor(public readonly orderId: string) {}
}

class PaymentReceivedEvent {
  constructor(public readonly amount: number) {}
}

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('calls a subscriber when the matching event is published', () => {
    const handler = jest.fn();
    bus.subscribe(OrderCreatedEvent, handler);

    bus.publish(new OrderCreatedEvent('order-1'));

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'order-1' }));
  });

  it('calls all subscribers for the same event type', () => {
    const h1 = jest.fn();
    const h2 = jest.fn();
    bus.subscribe(OrderCreatedEvent, h1);
    bus.subscribe(OrderCreatedEvent, h2);

    bus.publish(new OrderCreatedEvent('order-2'));

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('does not call subscribers for a different event type', () => {
    const orderHandler = jest.fn();
    const paymentHandler = jest.fn();
    bus.subscribe(OrderCreatedEvent, orderHandler);
    bus.subscribe(PaymentReceivedEvent, paymentHandler);

    bus.publish(new OrderCreatedEvent('order-3'));

    expect(paymentHandler).not.toHaveBeenCalled();
  });

  it('accepts an optional requestId without throwing', () => {
    const handler = jest.fn();
    bus.subscribe(OrderCreatedEvent, handler);

    expect(() => bus.publish(new OrderCreatedEvent('order-4'), 'req-xyz')).not.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
