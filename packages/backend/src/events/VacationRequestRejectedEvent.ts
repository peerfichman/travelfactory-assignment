export class VacationRequestRejectedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly validatorId: string,
    public readonly comments: string,
  ) {}
}
