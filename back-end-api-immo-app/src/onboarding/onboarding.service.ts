import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../infrastructure/redis/redis.service';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateOnboardingDraftDto } from './dto/onboarding-draft.dto';
import { UpdateProfileCommand } from '../profile/commands/impl/update-profile.command/update-profile.command';
// Remarque : Normalement on utiliserait UpdateUserCommand, on va simuler l'enregistrement global
import { DataSource } from 'typeorm';
import { UserModel, UserRole } from '../auth/models/user.model/user.model';
import { ProfileEntity } from '../profile/entities/profile.entity';

const ONBOARDING_TTL = 86400 * 7; // 7 jours de TTL pour un brouillon

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly commandBus: CommandBus,
    private readonly dataSource: DataSource,
  ) {}

  private getRedisKey(userId: string): string {
    return `onboarding:draft:${userId}`;
  }

  async getDraft(userId: string): Promise<any> {
    const draft = await this.redisService.get(this.getRedisKey(userId));
    return draft || {};
  }

  async updateDraft(userId: string, dto: UpdateOnboardingDraftDto): Promise<any> {
    const draft = await this.getDraft(userId);
    const updatedDraft = { ...draft, ...dto };
    await this.redisService.set(this.getRedisKey(userId), updatedDraft, ONBOARDING_TTL);
    this.logger.log(`Draft mis à jour pour user ${userId}`);
    return updatedDraft;
  }

  async finalizeOnboarding(userId: string): Promise<any> {
    const draft = await this.getDraft(userId);
    if (!draft || Object.keys(draft).length === 0) {
      throw new Error("Aucun brouillon d'onboarding trouvé.");
    }

    // 1. Mettre à jour l'utilisateur (Basic info + Role)
    await this.dataSource.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserModel);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (user) {
        if (draft.first_name) user.first_name = draft.first_name;
        if (draft.last_name) user.last_name = draft.last_name;
        if (draft.email) user.email = draft.email;
        if (draft.avatar_url) user.avatar_url = draft.avatar_url;
        if (draft.role) user.role = draft.role as UserRole;
        await userRepo.save(user);
      }

      // 2. Mettre à jour le profil (via CQRS ou directement en BDD)
      // Pour être consistant avec le chiffrement, on utilise le commandBus
      const profileCmd = new UpdateProfileCommand();
      profileCmd.userId = userId;
      if (draft.company) profileCmd.company = draft.company;
      if (draft.ifu) profileCmd.ifu = draft.ifu;
      if (draft.rccm) profileCmd.rccm = draft.rccm;
      if (draft.preferred_zones) profileCmd.preferred_zones = draft.preferred_zones;
      if (draft.budget_min) profileCmd.budget_min = draft.budget_min;
      if (draft.budget_max) profileCmd.budget_max = draft.budget_max;
      
      await this.commandBus.execute(profileCmd);
    });

    // 3. Purger le cache Redis
    await this.redisService.del(this.getRedisKey(userId));
    this.logger.log(`Onboarding finalisé pour user ${userId}. Données sauvegardées en base et cache purgé.`);
    
    return { success: true, message: "Onboarding completed successfully" };
  }
}
