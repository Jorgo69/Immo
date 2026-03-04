export class SignLeaseCommand {
  constructor(
    public readonly leaseId: string,
    public readonly userId: string,
  ) {}
}
