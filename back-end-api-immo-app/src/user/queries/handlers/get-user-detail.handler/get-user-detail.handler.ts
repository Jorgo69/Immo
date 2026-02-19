/**
 * Handler : détail utilisateur + stats (biens, chambres, wallet, transactions) pour l’admin.
 */
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetUserDetailQuery } from '../../impl/get-user-detail.query/get-user-detail.query';
import { UserModel } from '../../../../auth/models/user.model/user.model';
import { PropertyEntity } from '../../../../property/entities/property.entity';
import { RoomEntity } from '../../../../property/entities/room.entity';
import { WalletEntity } from '../../../../wallet/entities/wallet.entity';
import { TransactionEntity } from '../../../../wallet/entities/transaction.entity';

export interface UserDetailStatsDto {
  propertiesAsOwnerCount: number;
  roomsAsOwnerCount: number;
  propertiesAsAgentCount: number;
  roomsAsAgentCount: number;
  walletBalanceTotal: string | null;
  walletBalanceSavings: string | null;
  transactionsCount: number;
  lastTransactionAt: string | null;
}

export interface UserDetailResultDto {
  user: Partial<UserModel>;
  stats: UserDetailStatsDto;
}

@QueryHandler(GetUserDetailQuery)
export class GetUserDetailHandler implements IQueryHandler<GetUserDetailQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetUserDetailQuery): Promise<UserDetailResultDto> {
    const userRepo = this.dataSource.getRepository(UserModel);
    const user = await userRepo.findOne({
      where: { id: query.id },
      select: [
        'id',
        'phone_number',
        'first_name',
        'last_name',
        'email',
        'avatar_url',
        'is_profile_complete',
        'is_verified',
        'preferred_lang',
        'role',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const propertyRepo = this.dataSource.getRepository(PropertyEntity);
    const roomRepo = this.dataSource.getRepository(RoomEntity);
    const walletRepo = this.dataSource.getRepository(WalletEntity);
    const transactionRepo = this.dataSource.getRepository(TransactionEntity);

    const [propertiesAsOwnerCount, propertiesAsAgentCount] = await Promise.all([
      propertyRepo.count({ where: { owner_id: query.id } }),
      propertyRepo.count({ where: { agent_id: query.id } }),
    ]);

    const ownedIds =
      propertiesAsOwnerCount > 0
        ? (await propertyRepo.find({ where: { owner_id: query.id }, select: ['id'] })).map((p) => p.id)
        : [];
    const managedIds =
      propertiesAsAgentCount > 0
        ? (await propertyRepo.find({ where: { agent_id: query.id }, select: ['id'] })).map((p) => p.id)
        : [];
    let roomsAsOwnerTotal = 0;
    let roomsAsAgentTotal = 0;
    if (ownedIds.length > 0) {
      roomsAsOwnerTotal = await roomRepo
        .createQueryBuilder('r')
        .where('r.property_id IN (:...ids)', { ids: ownedIds })
        .getCount();
    }
    if (managedIds.length > 0) {
      roomsAsAgentTotal = await roomRepo
        .createQueryBuilder('r')
        .where('r.property_id IN (:...ids)', { ids: managedIds })
        .getCount();
    }

    const wallet = await walletRepo.findOne({ where: { user_id: query.id } });
    let walletBalanceTotal: string | null = null;
    let walletBalanceSavings: string | null = null;
    let transactionsCount = 0;
    let lastTransactionAt: string | null = null;

    if (wallet) {
      walletBalanceTotal = wallet.balance_total;
      walletBalanceSavings = wallet.balance_savings;
      const [count, lastTx] = await Promise.all([
        transactionRepo.count({ where: { wallet_id: wallet.id } }),
        transactionRepo.findOne({
          where: { wallet_id: wallet.id },
          order: { created_at: 'DESC' },
          select: ['created_at'],
        }),
      ]);
      transactionsCount = count;
      if (lastTx?.created_at) lastTransactionAt = new Date(lastTx.created_at).toISOString();
    }

    return {
      user,
      stats: {
        propertiesAsOwnerCount,
        roomsAsOwnerCount: roomsAsOwnerTotal,
        propertiesAsAgentCount,
        roomsAsAgentCount: roomsAsAgentTotal,
        walletBalanceTotal,
        walletBalanceSavings,
        transactionsCount,
        lastTransactionAt,
      },
    };
  }
}
