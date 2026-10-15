import { CommandBus } from '../../src/infrastructure/CommandBus';

class PingCommand {
  constructor(public readonly payload: string) {}
}

class UnknownCommand {}

describe('CommandBus', () => {
  let bus: CommandBus;

  beforeEach(() => {
    bus = new CommandBus();
  });

  it('dispatches to a registered handler and returns the result', async () => {
    const handler = jest.fn().mockResolvedValue({ pong: true });
    bus.register(PingCommand, handler);

    const result = await bus.dispatch(new PingCommand('hello'));

    expect(handler).toHaveBeenCalledWith(expect.any(PingCommand), undefined);
    expect(result).toEqual({ pong: true });
  });

  it('passes requestId to the handler', async () => {
    const handler = jest.fn().mockResolvedValue(null);
    bus.register(PingCommand, handler);

    await bus.dispatch(new PingCommand('data'), 'req-abc');

    expect(handler).toHaveBeenCalledWith(expect.any(PingCommand), 'req-abc');
  });

  it('throws when no handler is registered for the command', async () => {
    await expect(bus.dispatch(new UnknownCommand())).rejects.toThrow(
      'No handler registered for command: UnknownCommand',
    );
  });

  it('propagates errors thrown by the handler', async () => {
    bus.register(PingCommand, async () => {
      throw new Error('handler blew up');
    });
    await expect(bus.dispatch(new PingCommand('x'))).rejects.toThrow('handler blew up');
  });
});
