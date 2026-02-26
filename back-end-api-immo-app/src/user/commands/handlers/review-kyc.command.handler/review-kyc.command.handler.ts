import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewKycCommand, KycReviewAction } from '../../impl/review-kyc.command/review-kyc.command';
import { Logger, NotFoundException } from '@nestjs/common';
import { ProfileEntity, KycStatus } from '../../../../profile/entities/profile.entity';
import { UserModel } from '../../../../auth/models/user.model/user.model';

@CommandHandler(ReviewKycCommand)
export class ReviewKycCommandHandler implements ICommandHandler<ReviewKycCommand> {
  private readonly logger = new Logger(ReviewKycCommandHandler.name);

  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
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
      // Optionnel : on pourrait aussi mettre à jour user.is_verified = true
      user.is_verified = true;
      await this.userRepository.save(user);
    } else {
      profile.kyc_status = KycStatus.REJECTED;
      profile.kyc_rejection_reason = command.rejection_reason ?? null;
      profile.kyc_reviewed_at = now;
    }

    await this.profileRepository.save(profile);
    this.logger.log(`KYC status for user ${user.id} updated to ${profile.kyc_status}`);

    return {
      success: true,
      status: profile.kyc_status,
    };
  }
}
