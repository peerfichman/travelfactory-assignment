import { eventBus } from '../infrastructure/EventBus';
import { VacationRequestCreatedEvent } from '../events/VacationRequestCreatedEvent';
import { VacationRequestApprovedEvent } from '../events/VacationRequestApprovedEvent';
import { VacationRequestRejectedEvent } from '../events/VacationRequestRejectedEvent';
import { logger } from '../infrastructure/logger';

export function registerEventHandlers(): void {
  eventBus.subscribe(VacationRequestCreatedEvent, (event) => {
    logger.info(
      { requestId: event.requestId, userId: event.userId },
      'VacationRequest created — notifying team',
    );
  });

  eventBus.subscribe(VacationRequestApprovedEvent, (event) => {
    logger.info(
      { requestId: event.requestId, userId: event.userId, validatorId: event.validatorId },
      'VacationRequest approved — notifying requester',
    );
  });

  eventBus.subscribe(VacationRequestRejectedEvent, (event) => {
    logger.info(
      { requestId: event.requestId, userId: event.userId, validatorId: event.validatorId },
      'VacationRequest rejected — notifying requester',
    );
  });
}
