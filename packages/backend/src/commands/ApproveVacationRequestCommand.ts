export class ApproveVacationRequestCommand {
  constructor(
    public readonly requestId: string,
    public readonly validatorId: string,
  ) {}
}
