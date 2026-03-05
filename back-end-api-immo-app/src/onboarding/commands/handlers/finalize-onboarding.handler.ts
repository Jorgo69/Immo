import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { FinalizeOnboardingCommand } from '../impl/finalize-onboarding.command';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { UserModel, UserRole } from '../../../auth/models/user.model/user.model';
import { UpdateProfileCommand } from '../../../profile/commands/impl/update-profile.command/update-profile.command';
import { Logger, BadRequestException } from '@nestjs/common';

@CommandHandler(FinalizeOnboardingCommand)
export class FinalizeOnboardingHandler implements ICommandHandler<FinalizeOnboardingCommand> {
  private readonly logger = new Logger(FinalizeOnboardingHandler.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly commandBus: CommandBus,
    private readonly dataSource: DataSource,
  ) {}

  private getRedisKey(userId: string): string {
    return `onboarding:draft:${userId}`;
  }

  async execute(command: FinalizeOnboardingCommand): Promise<any> {
    const { userId } = command;
    const key = this.getRedisKey(userId);
    const draft = await this.redisService.get(key);
    
    if (!draft || Object.keys(draft).length === 0) {
      throw new BadRequestException("Aucun brouillon d'onboarding trouvé.");
    }

    await this.dataSource.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserModel);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (user) {
        if (draft.first_name) user.first_name = draft.first_name;
        if (draft.last_name) user.last_name = draft.last_name;
        if (draft.email) user.email = draft.email;
        if (draft.avatar_url) user.avatar_url = draft.avatar_url;
        if (draft.role) user.role = draft.role as UserRole;
        user.is_profile_complete = true;
        await userRepo.save(user);
      }

      const profileCmd = new UpdateProfileCommand();
      profileCmd.userId = userId;
      if (draft.company) profileCmd.company = draft.company;
      if (draft.ifu) profileCmd.ifu = draft.ifu;
      if (draft.rccm) profileCmd.rccm = draft.rccm;
      if (draft.cpi) profileCmd.cpi = draft.cpi;
      if (draft.preferred_zones) profileCmd.preferred_zones = draft.preferred_zones;
      if (draft.budget_min) profileCmd.budget_min = draft.budget_min;
      if (draft.budget_max) profileCmd.budget_max = draft.budget_max;
      
      await this.commandBus.execute(profileCmd);
    });

    await this.redisService.del(key);
    this.logger.log(`Onboarding finalisé pour user ${userId}. Données sauvegardées en base et cache purgé.`);
    
    return { success: true, message: "Onboarding completed successfully" };
  }
}
