export class VacationRequestApprovedEvent {
  constructor(
    public readonly requestId: string,
    public readonly userId: string,
    public readonly validatorId: string,
  ) {}
}
