import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserModel, UserStatus } from '../../auth/models/user.model/user.model';

@Injectable()
export class UserCronService {
  private readonly logger = new Logger(UserCronService.name);

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleInactiveAccounts() {
    this.logger.log('Début du job Cron : gestion des comptes inactifs et suppressions définies.');
    
    // 1. Restreindre les comptes inactifs (> 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const inactiveUsers = await this.userRepository.find({
      where: {
        status: UserStatus.ACTIVE,
        last_login_at: LessThan(sixMonthsAgo),
      },
    });

    if (inactiveUsers.length > 0) {
      for (const user of inactiveUsers) {
        user.status = UserStatus.RESTRICTED;
      }
      await this.userRepository.save(inactiveUsers);
      this.logger.log(`${inactiveUsers.length} utilisateurs restreints pour inactivité (6 mois).`);
    }

    // 2. Hard delete des comptes "soft-deleted" (> 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const softDeletedUsers = await this.userRepository.find({
      withDeleted: true,
      where: {
        deleted_at: LessThan(thirtyDaysAgo),
      },
    });

    if (softDeletedUsers.length > 0) {
      await this.userRepository.remove(softDeletedUsers);
      this.logger.log(`${softDeletedUsers.length} comptes définitivement supprimés (hard delete).`);
    }
    
    this.logger.log('Fin du job Cron (UserLifecycle).');
  }
}
