import { logger } from './logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommandHandler<T> = (command: T, requestId?: string) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommandConstructor<T> = new (...args: any[]) => T;

export class CommandBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<string, CommandHandler<any>>();

  register<T>(commandClass: CommandConstructor<T>, handler: CommandHandler<T>): void {
    this.handlers.set(commandClass.name, handler);
  }

  async dispatch<T>(command: T, requestId?: string): Promise<unknown> {
    const name = (command as object).constructor.name;
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for command: ${name}`);
    }
    const log = requestId ? logger.child({ requestId }) : logger;
    log.info({ command: name }, `Command dispatched: ${name}`);
    return handler(command, requestId);
  }
}

export const commandBus = new CommandBus();
