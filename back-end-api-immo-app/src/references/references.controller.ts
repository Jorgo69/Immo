/**
 * Controller des référentiels — GET /ref/all + moteur (categories, types, features).
 * CRUD Admin sur ref_categories, ref_types, ref_features.
 */
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';
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

  @Get('categories')
  @ApiOperation({ summary: 'Liste des catégories (Location, Vente, …)' })
  async getCategories() {
    return this.referencesService.getCategories();
  }

  @Get('property-types')
  @ApiOperation({ summary: 'Types de bâtiments (Villa, Immeuble, Maison de ville, ...)' })
  async getPropertyTypes() {
    return this.referencesService.getPropertyTypes();
  }

  @Get('unit-types')
  @ApiOperation({ summary: 'Types d’unités (Studio, Chambre-Salon, ...)' })
  async getUnitTypes() {
    return this.referencesService.getUnitTypes();
  }

  @Get('types')
  @ApiOperation({ summary: 'Liste des types (optionnel: categoryId pour filtrer)' })
  async getTypes(@Query('categoryId') categoryId?: string) {
    return this.referencesService.getTypes(categoryId || undefined);
  }

  @Get('types/:id/features')
  @ApiOperation({ summary: 'Équipements (features) pour un type donné' })
  async getFeaturesByTypeId(@Param('id') id: string) {
    return this.referencesService.getFeaturesByTypeId(id);
  }

  // ——— Admin CRUD ———
  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une catégorie (Admin)' })
  async createCategory(@Body() body: { code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createCategory(body);
  }

  @Put('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier une catégorie (Admin)' })
  async updateCategory(@Param('id') id: string, @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.updateCategory(id, body);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer une catégorie (Admin)' })
  async deleteCategory(@Param('id') id: string) {
    await this.referencesService.deleteCategory(id);
  }

  @Post('admin/property-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un type de bâtiment (Admin)' })
  async createPropertyType(@Body() body: { code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createPropertyType(body);
  }

  @Put('admin/property-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un type de bâtiment (Admin)' })
  async updatePropertyType(
    @Param('id') id: string,
    @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number },
  ) {
    return this.referencesService.updatePropertyType(id, body);
  }

  @Delete('admin/property-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un type de bâtiment (Admin)' })
  async deletePropertyType(@Param('id') id: string) {
    await this.referencesService.deletePropertyType(id);
  }

  @Post('admin/types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un type (Admin)' })
  async createType(@Body() body: { ref_category_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createType(body);
  }

  @Put('admin/types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un type (Admin)' })
  async updateType(@Param('id') id: string, @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.updateType(id, body);
  }

  @Delete('admin/types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un type (Admin)' })
  async deleteType(@Param('id') id: string) {
    await this.referencesService.deleteType(id);
  }

  @Post('admin/unit-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un type d’unité (Admin)' })
  async createUnitType(@Body() body: { code: string; label_fr: string; label_en?: string; sort_order?: number; property_type_id?: string }) {
    return this.referencesService.createUnitType(body);
  }

  @Put('admin/unit-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un type d’unité (Admin)' })
  async updateUnitType(
    @Param('id') id: string,
    @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number; property_type_id?: string | null },
  ) {
    return this.referencesService.updateUnitType(id, body);
  }

  @Delete('admin/unit-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un type d’unité (Admin)' })
  async deleteUnitType(@Param('id') id: string) {
    await this.referencesService.deleteUnitType(id);
  }

  @Post('admin/features')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un équipement/feature (Admin)' })
  async createFeature(@Body() body: { ref_type_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createFeature(body);
  }

  @Put('admin/features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un feature (Admin)' })
  async updateFeature(@Param('id') id: string, @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.updateFeature(id, body);
  }

  @Delete('admin/features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un feature (Admin)' })
  async deleteFeature(@Param('id') id: string) {
    await this.referencesService.deleteFeature(id);
  }
}
