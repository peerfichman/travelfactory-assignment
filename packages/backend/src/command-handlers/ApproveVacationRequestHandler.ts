import { ApproveVacationRequestCommand } from '../commands/ApproveVacationRequestCommand';
import { VacationRequestRepository } from '../repositories/VacationRequestRepository';
import { RequestStatus } from '../entities/VacationRequest';
import { VacationRequestApprovedEvent } from '../events/VacationRequestApprovedEvent';
import { eventBus } from '../infrastructure/EventBus';
import { AppError } from './CreateVacationRequestHandler';

export async function approveVacationRequestHandler(
  command: ApproveVacationRequestCommand,
): Promise<void> {
  const { requestId, validatorId } = command;

  const request = await VacationRequestRepository.findOne({ where: { id: requestId } });
  if (!request) throw new AppError(404, 'Vacation request not found');
  if (request.status === RequestStatus.APPROVED) {
    throw new AppError(409, 'Request is already approved');
  }

  request.status = RequestStatus.APPROVED;
  await VacationRequestRepository.save(request);

  eventBus.publish(new VacationRequestApprovedEvent(requestId, request.user_id, validatorId));
}
