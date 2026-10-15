import { registerHandlerRefs } from 'commoneventframework';
import { commandBus } from './CommandBus';
import { CreateVacationRequestCommand } from '../commands/CreateVacationRequestCommand';
import { ApproveVacationRequestCommand } from '../commands/ApproveVacationRequestCommand';
import { RejectVacationRequestCommand } from '../commands/RejectVacationRequestCommand';
import { createVacationRequestHandler } from '../command-handlers/CreateVacationRequestHandler';
import { approveVacationRequestHandler } from '../command-handlers/ApproveVacationRequestHandler';
import { rejectVacationRequestHandler } from '../command-handlers/RejectVacationRequestHandler';
import { registerEventHandlers } from '../event-handlers/VacationRequestEventHandlers';
import * as authHandlers from '../handlers/auth';
import * as vacationHandlers from '../handlers/vacationRequests';

export function bootstrap(): void {
  commandBus.register(CreateVacationRequestCommand, createVacationRequestHandler);
  commandBus.register(ApproveVacationRequestCommand, approveVacationRequestHandler);
  commandBus.register(RejectVacationRequestCommand, rejectVacationRequestHandler);
  registerEventHandlers();

  // Register HTTP handlers with CEF so resolveHandlerRef finds them in-process
  // (required for bundled Lambda and ts-jest test environments)
  registerHandlerRefs({
    'handlers/auth#login': authHandlers.login,
    'handlers/auth#parseLoginInput': authHandlers.parseLoginInput,
    'handlers/vacationRequests#list': vacationHandlers.list,
    'handlers/vacationRequests#parseListInput': vacationHandlers.parseListInput,
    'handlers/vacationRequests#create': vacationHandlers.create,
    'handlers/vacationRequests#parseCreateInput': vacationHandlers.parseCreateInput,
    'handlers/vacationRequests#approve': vacationHandlers.approve,
    'handlers/vacationRequests#parseApproveInput': vacationHandlers.parseApproveInput,
    'handlers/vacationRequests#reject': vacationHandlers.reject,
    'handlers/vacationRequests#parseRejectInput': vacationHandlers.parseRejectInput,
  });
}
