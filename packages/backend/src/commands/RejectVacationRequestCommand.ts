export class RejectVacationRequestCommand {
  constructor(
    public readonly requestId: string,
    public readonly validatorId: string,
    public readonly comments: string,
  ) {}
}
