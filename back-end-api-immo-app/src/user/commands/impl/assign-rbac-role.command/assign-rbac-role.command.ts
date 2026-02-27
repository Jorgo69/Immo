export class AssignRbacRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string | null,
    public readonly reason: string,
  ) {}
}
