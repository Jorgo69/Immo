/**
 * Controller des référentiels — GET /ref/all.
 * Endpoint groupé pour optimiser le chargement Front (un seul appel).
 */
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReferencesService } from './references.service';

@ApiTags('References')
@Controller('ref')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Get('all')
  @ApiOperation({ summary: 'Tous les référentiels (propertyTypes, propertyStatuses, unitTypes, unitFeatures)' })
  async getAll() {
    return this.referencesService.getAll();
  }
}
