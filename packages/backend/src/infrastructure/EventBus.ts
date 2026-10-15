import { EventEmitter } from 'events';
import { logger } from './logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventConstructor<T> = new (...args: any[]) => T;

class EventBus extends EventEmitter {
  publish(event: object): void {
    const name = event.constructor.name;
    logger.info({ event: name }, `Event published: ${name}`);
    this.emit(name, event);
  }

  subscribe<T>(eventClass: EventConstructor<T>, handler: (event: T) => void): void {
    this.on(eventClass.name, handler);
  }
}

export const eventBus = new EventBus();
