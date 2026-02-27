import { UserStatus } from '../../../../auth/models/user.model/user.model';

export class ChangeStatusCommand {
  constructor(
    public readonly id: string,
    public readonly status: UserStatus,
    public readonly reason: string,
  ) {}
}
