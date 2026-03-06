import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewKycCommand, KycReviewAction } from '../../impl/review-kyc.command/review-kyc.command';
import { Logger, NotFoundException } from '@nestjs/common';
import { ProfileEntity, KycStatus } from '../../../../profile/entities/profile.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';

import { ReputationService } from '../../../../profile/services/reputation.service';
import { NotificationService } from '../../../../notification/services/notification.service';
import { NotificationType } from '../../../../notification/entities/notification.entity';
import { AuditService } from '../../../../audit/audit.service';
import { ActivityAction } from '../../../../audit/entities/activity-log.entity';

@CommandHandler(ReviewKycCommand)
export class ReviewKycCommandHandler implements ICommandHandler<ReviewKycCommand> {
  private readonly logger = new Logger(ReviewKycCommandHandler.name);

  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    private readonly reputationService: ReputationService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: ReviewKycCommand): Promise<{ success: boolean; status: string }> {
    const user = await this.userRepository.findOne({ where: { id: command.user_id } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepository.findOne({ where: { user_id: command.user_id } });
    if (!profile) throw new NotFoundException('Profile not found');

    const now = new Date();

    if (command.action === KycReviewAction.APPROVE) {
      profile.kyc_status = KycStatus.VERIFIED;
      profile.kyc_rejection_reason = null;
      profile.kyc_reviewed_at = now;
      user.is_verified = true;
      await this.userRepository.save(user);

      // Notification de succès
      await this.notificationService.notify(user.id, {
        title_fr: 'Compte vérifié !',
        title_en: 'Account Verified!',
        message_fr: 'Félicitations, votre identité a été validée par nos services. Vous avez maintenant accès à toutes les fonctionnalités.',
        message_en: 'Congratulations, your identity has been validated. You now have access to all features.',
        type: NotificationType.SUCCESS,
        metadata: { msgKey: 'kyc_approved' }
      });

      // Audit Log
      await this.auditService.logActivity({
        userId: command.admin_id,
        action: ActivityAction.VERIFY_KYC,
        entityType: 'User',
        entityId: user.id,
        description: `L'administrateur a validé le KYC de l'utilisateur ${user.phone_number}`
      });
    } else {
      profile.kyc_status = KycStatus.REJECTED;
      profile.kyc_rejection_reason = command.rejection_reason ?? null;
      profile.kyc_reviewed_at = now;

      // Notification d'échec
      await this.notificationService.notify(user.id, {
        title_fr: 'KYC refusé',
        title_en: 'KYC Rejected',
        message_fr: `Votre dossier d'identité a été rejeté pour la raison suivante : ${profile.kyc_rejection_reason}. Veuillez soumettre à nouveau vos documents.`,
        message_en: `Your identity documents were rejected for the following reason: ${profile.kyc_rejection_reason}. Please resubmit your documents.`,
        type: NotificationType.CRITICAL,
        metadata: { 
          msgKey: 'kyc_rejected',
          reason: profile.kyc_rejection_reason 
        }
      });

      // Audit Log
      await this.auditService.logActivity({
        userId: command.admin_id,
        action: ActivityAction.REJECT_KYC,
        entityType: 'User',
        entityId: user.id,
        description: `L'administrateur a rejeté le KYC de l'utilisateur ${user.phone_number}. Raison: ${profile.kyc_rejection_reason}`,
        newValues: { reason: profile.kyc_rejection_reason }
      });
    }

    await this.profileRepository.save(profile);
    
    // Recalcul de la réputation suite au changement de statut KYC
    await this.reputationService.updateReputationScore(user.id);

    this.logger.log(`KYC status for user ${user.id} updated to ${profile.kyc_status}`);

    return {
      success: true,
      status: profile.kyc_status,
    };
  }
}
