/**
 * Handler : Statistiques globales pour le Dashboard Admin.
 * Retourne : total users par statut, KYC en attente, nouvelles inscriptions 30j, et derniers inscrits.
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GetAdminStatsQuery } from '../../impl/get-admin-stats.query/get-admin-stats.query';
import { UserModel, UserStatus } from '../../../../auth/models/user.model/user.model';
import { ProfileEntity, KycStatus } from '../../../../profile/entities/profile.entity';

export interface AdminDashboardStatsDto {
  users: {
    total: number;
    active: number;
    restricted: number;
    banned: number;
    newLast30Days: number;
  };
  kyc: {
    pending: number;
    verified: number;
    rejected: number;
  };
  recentSignups: Array<{
    id: string;
    phone_number: string;
    role: string;
    status: string;
    created_at: string;
  }>;
  kycPendingList: Array<{
    userId: string;
    phone_number: string;
    role: string;
    kycStatus: string;
    submittedAt: string | null;
  }>;
}

@QueryHandler(GetAdminStatsQuery)
export class GetAdminStatsHandler implements IQueryHandler<GetAdminStatsQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<AdminDashboardStatsDto> {
    const userRepo = this.dataSource.getRepository(UserModel);
    const profileRepo = this.dataSource.getRepository(ProfileEntity);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      restrictedUsers,
      bannedUsers,
      newUsers,
      kycPending,
      kycVerified,
      kycRejected,
    ] = await Promise.all([
      userRepo.count({ where: { deleted_at: null as any } }),
      userRepo.count({ where: { status: UserStatus.ACTIVE, deleted_at: null as any } }),
      userRepo.count({ where: { status: UserStatus.RESTRICTED, deleted_at: null as any } }),
      userRepo.count({ where: { status: UserStatus.BANNED, deleted_at: null as any } }),
      userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :date', { date: thirtyDaysAgo })
        .andWhere('u.deleted_at IS NULL')
        .getCount(),
      profileRepo.count({ where: { kyc_status: KycStatus.PENDING } }),
      profileRepo.count({ where: { kyc_status: KycStatus.VERIFIED } }),
      profileRepo.count({ where: { kyc_status: KycStatus.REJECTED } }),
    ]);

    // Dernières inscriptions (10 max)
    const recentUsers = await userRepo.find({
      where: { deleted_at: null as any },
      order: { created_at: 'DESC' },
      take: 10,
      select: ['id', 'phone_number', 'role', 'status', 'created_at'],
    });

    // KYC en attente (avec infos user)
    const pendingProfiles = await profileRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'u')
      .where('p.kyc_status = :status', { status: KycStatus.PENDING })
      .orderBy('p.kyc_submitted_at', 'ASC', 'NULLS LAST')
      .take(20)
      .getMany();

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        restricted: restrictedUsers,
        banned: bannedUsers,
        newLast30Days: newUsers,
      },
      kyc: {
        pending: kycPending,
        verified: kycVerified,
        rejected: kycRejected,
      },
      recentSignups: recentUsers.map((u) => ({
        id: u.id,
        phone_number: u.phone_number,
        role: u.role,
        status: u.status,
        created_at: new Date(u.created_at).toISOString(),
      })),
      kycPendingList: pendingProfiles.map((p) => ({
        userId: p.user_id,
        phone_number: p.user?.phone_number ?? '',
        role: p.user?.role ?? '',
        kycStatus: p.kyc_status,
        submittedAt: p.kyc_submitted_at ? new Date(p.kyc_submitted_at).toISOString() : null,
      })),
    };
  }
}
