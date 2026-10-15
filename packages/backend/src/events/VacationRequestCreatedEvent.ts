export class VacationRequestCreatedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly startDate: string,
    public readonly endDate: string,
  ) {}
}
