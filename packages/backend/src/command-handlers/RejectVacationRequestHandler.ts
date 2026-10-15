import { RejectVacationRequestCommand } from '../commands/RejectVacationRequestCommand';
import { VacationRequestRepository } from '../repositories/VacationRequestRepository';
import { RequestStatus } from '../entities/VacationRequest';
import { VacationRequestRejectedEvent } from '../events/VacationRequestRejectedEvent';
import { eventBus } from '../infrastructure/EventBus';
import { AppError } from './CreateVacationRequestHandler';

export async function rejectVacationRequestHandler(
  command: RejectVacationRequestCommand,
  requestId?: string,
): Promise<void> {
  const { requestId: vacReqId, validatorId, comments } = command;

  if (!comments || comments.trim().length === 0) {
    throw new AppError(400, 'A rejection comment is required');
  }

  const request = await VacationRequestRepository.findOne({ where: { id: vacReqId } });
  if (!request) throw new AppError(404, 'Vacation request not found');
  if (request.status === RequestStatus.APPROVED) {
    throw new AppError(409, 'Approved requests cannot be modified');
  }

  request.status = RequestStatus.REJECTED;
  request.comments = comments.trim();
  await VacationRequestRepository.save(request);

  eventBus.publish(
    new VacationRequestRejectedEvent(vacReqId, request.user_id, validatorId, comments),
    requestId,
  );
}
