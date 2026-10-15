import { CreateVacationRequestCommand } from '../commands/CreateVacationRequestCommand';
import { VacationRequestRepository } from '../repositories/VacationRequestRepository';
import { VacationRequestCreatedEvent } from '../events/VacationRequestCreatedEvent';
import { eventBus } from '../infrastructure/EventBus';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export async function createVacationRequestHandler(
  command: CreateVacationRequestCommand,
  requestId?: string,
): Promise<{ id: string }> {
  const { userId, startDate, endDate, reason } = command;

  const today = new Date().toISOString().split('T')[0];
  if (startDate < today) {
    throw new AppError(400, 'Start date cannot be in the past');
  }
  if (endDate <= startDate) {
    throw new AppError(400, 'End date must be after start date');
  }

  const overlapping = await VacationRequestRepository.findOverlapping(userId, startDate, endDate);
  if (overlapping.length > 0) {
    throw new AppError(409, 'Vacation request overlaps with an existing request');
  }

  const request = VacationRequestRepository.create({
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
    reason: reason ?? null,
  });

  const saved = await VacationRequestRepository.save(request);

  eventBus.publish(
    new VacationRequestCreatedEvent(saved.id, userId, startDate, endDate),
    requestId,
  );

  return { id: saved.id };
}
