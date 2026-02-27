import { Injectable } from '@nestjs/common';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { AuditService } from '../audit.service';
import { ActivityAction } from '../entities/activity-log.entity';
import { AuditContext } from '../audit.context';

// Liste des entités que l'on souhaite auditer automatiquement
const AUDITABLE_ENTITIES = ['UserModel', 'PropertyEntity', 'UnitEntity', 'ProfileEntity'];

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  private isAuditable(entityOrName: any): boolean {
    if (!entityOrName) return false;
    const name = typeof entityOrName === 'string' ? entityOrName : entityOrName.constructor.name;
    return AUDITABLE_ENTITIES.includes(name);
  }

  private getContext() {
    return AuditContext.getStore();
  }

  afterInsert(event: InsertEvent<any>) {
    if (!this.isAuditable(event.entity)) return;

    const ctx = this.getContext();
    const entityName = event.metadata.name;
    const entityId = event.entity.id;

    // L'enregistrement d'audit se fait de manière Fire-And-Forget
    this.auditService.logActivity({
      userId: ctx?.userId,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
      action: ActivityAction.CREATE,
      entityType: entityName,
      entityId: entityId,
      newValues: event.entity,
      description: `Création de ${entityName}`,
    }).catch(() => {});
  }

  afterUpdate(event: UpdateEvent<any>) {
    if (!this.isAuditable(event.entity)) return;

    const ctx = this.getContext();
    const entityName = event.metadata.name;
    const entityId = event.entity?.id || event.databaseEntity?.id;

    // Extraire uniquement les colonnes modifiées
    const oldValues = {};
    const newValues = {};
    
    event.updatedColumns.forEach((col) => {
      const propName = col.propertyName;
      oldValues[propName] = event.databaseEntity ? event.databaseEntity[propName] : undefined;
      newValues[propName] = event.entity ? event.entity[propName] : undefined;
    });

    // Si aucune colonne trackée n'a changé, pas besoin de logger
    if (Object.keys(newValues).length === 0) return;

    this.auditService.logActivity({
      userId: ctx?.userId,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
      action: ActivityAction.UPDATE,
      entityType: entityName,
      entityId: entityId,
      oldValues: oldValues,
      newValues: newValues,
      description: `Mise à jour de ${entityName}`,
    }).catch(() => {});
  }

  afterRemove(event: RemoveEvent<any>) {
    if (!this.isAuditable(event.entity) && !this.isAuditable(event.metadata.name)) return;

    const ctx = this.getContext();
    const entityName = event.metadata.name;
    const entityId = event.entityId || event.databaseEntity?.id;

    this.auditService.logActivity({
      userId: ctx?.userId,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
      action: ActivityAction.DELETE,
      entityType: entityName,
      entityId: entityId,
      oldValues: event.databaseEntity || event.entity,
      description: `Suppression de ${entityName}`,
    }).catch(() => {});
  }
}
