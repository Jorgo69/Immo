import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { ActivityLogEntity } from './entities/activity-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogEntity])],
  controllers: [AuditController],
  providers: [AuditService, AuditSubscriber],
  exports: [AuditService],
})
export class AuditModule {}
