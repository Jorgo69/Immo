import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityAction, ActivityLogEntity } from './entities/activity-log.entity';

export interface CreateLogPayload {
  userId?: string;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(ActivityLogEntity)
    private readonly logRepository: Repository<ActivityLogEntity>,
  ) {}

  /**
   * Enregistre une activité dans la base de données.
   * Cette méthode peut être appelée de manière asynchrone sans "await" par le système
   * pour ne pas bloquer les requêtes utilisateurs.
   */
  async logActivity(payload: CreateLogPayload): Promise<void> {
    try {
      const log = this.logRepository.create({
        user_id: payload.userId,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId,
        old_values: payload.oldValues,
        new_values: payload.newValues,
        description: payload.description,
        ip_address: payload.ipAddress,
        user_agent: payload.userAgent,
      });

      await this.logRepository.save(log);
      //this.logger.debug(`Audit: ${payload.action} sur ${payload.entityType} (${payload.entityId}) enregistré.`);
    } catch (e) {
      this.logger.error(`Erreur lors de l'enregistrement de l'audit log : ${e.message}`, e.stack);
    }
  }

  async getLogs(limit = 50, offset = 0, filters?: Partial<ActivityLogEntity>): Promise<[ActivityLogEntity[], number]> {
    return this.logRepository.findAndCount({
      where: filters,
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
