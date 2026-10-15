export class CreateVacationRequestCommand {
  constructor(
    public readonly userId: string,
    public readonly startDate: string,
    public readonly endDate: string,
    public readonly reason: string | null,
  ) {}
}
