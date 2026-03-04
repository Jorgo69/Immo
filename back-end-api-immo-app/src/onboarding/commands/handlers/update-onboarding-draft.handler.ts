import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateOnboardingDraftCommand } from '../impl/update-onboarding-draft.command';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { Logger } from '@nestjs/common';

const ONBOARDING_TTL = 86400 * 7;

@CommandHandler(UpdateOnboardingDraftCommand)
export class UpdateOnboardingDraftHandler implements ICommandHandler<UpdateOnboardingDraftCommand> {
  private readonly logger = new Logger(UpdateOnboardingDraftHandler.name);

  constructor(private readonly redisService: RedisService) {}

  private getRedisKey(userId: string): string {
    return `onboarding:draft:${userId}`;
  }

  async execute(command: UpdateOnboardingDraftCommand): Promise<any> {
    const { userId, dto } = command;
    const key = this.getRedisKey(userId);
    const draft = (await this.redisService.get(key)) || {};
    const updatedDraft = { ...draft, ...dto };
    await this.redisService.set(key, updatedDraft, ONBOARDING_TTL);
    this.logger.log(`Draft mis à jour pour user ${userId}`);
    return updatedDraft;
  }
}
