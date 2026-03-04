import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OnboardingController } from './onboarding.controller';
import { EncryptionModule } from '../common/encryption/encryption.module';
import { GetOnboardingDraftHandler } from './queries/handlers/get-onboarding-draft.handler';
import { UpdateOnboardingDraftHandler } from './commands/handlers/update-onboarding-draft.handler';
import { FinalizeOnboardingHandler } from './commands/handlers/finalize-onboarding.handler';

const Handlers = [
  GetOnboardingDraftHandler,
  UpdateOnboardingDraftHandler,
  FinalizeOnboardingHandler,
];

@Module({
  imports: [CqrsModule, EncryptionModule],
  controllers: [OnboardingController],
  providers: [...Handlers],
})
export class OnboardingModule {}
