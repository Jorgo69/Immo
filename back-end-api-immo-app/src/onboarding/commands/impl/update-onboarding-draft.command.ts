import { UpdateOnboardingDraftDto } from '../../dto/onboarding-draft.dto';

export class UpdateOnboardingDraftCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateOnboardingDraftDto,
  ) {}
}
