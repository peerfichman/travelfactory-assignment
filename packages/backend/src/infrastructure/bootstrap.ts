import { commandBus } from './CommandBus';
import { CreateVacationRequestCommand } from '../commands/CreateVacationRequestCommand';
import { ApproveVacationRequestCommand } from '../commands/ApproveVacationRequestCommand';
import { RejectVacationRequestCommand } from '../commands/RejectVacationRequestCommand';
import { createVacationRequestHandler } from '../command-handlers/CreateVacationRequestHandler';
import { approveVacationRequestHandler } from '../command-handlers/ApproveVacationRequestHandler';
import { rejectVacationRequestHandler } from '../command-handlers/RejectVacationRequestHandler';
import { registerEventHandlers } from '../event-handlers/VacationRequestEventHandlers';

export function bootstrap(): void {
  commandBus.register(CreateVacationRequestCommand, createVacationRequestHandler);
  commandBus.register(ApproveVacationRequestCommand, approveVacationRequestHandler);
  commandBus.register(RejectVacationRequestCommand, rejectVacationRequestHandler);
  registerEventHandlers();
}
