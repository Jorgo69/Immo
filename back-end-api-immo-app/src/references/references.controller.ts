/**
 * Controller des référentiels — GET /ref/all + moteur (categories, types, features).
 * CRUD Admin : ref_categories, ref_types, ref_features, property_types, property_statuses, unit_types, unit_features.
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

  // ————————————————————————————————————————————————————————————
  // LECTURES PUBLIQUES
  // ————————————————————————————————————————————————————————————

  @Get('all')
  @ApiOperation({ summary: "Tous les référentiels (propertyTypes, propertyStatuses, unitTypes, unitFeatures)" })
  async getAll() {
    return this.referencesService.getAll();
  }

  @Get('categories')
  @ApiOperation({ summary: "Catégories (Location, Vente, ...)" })
  async getCategories() {
    return this.referencesService.getCategories();
  }

  @Get('property-types')
  @ApiOperation({ summary: "Types de bâtiments (Villa, Immeuble, ...)" })
  async getPropertyTypes() {
    return this.referencesService.getPropertyTypes();
  }

  @Get('property-statuses')
  @ApiOperation({ summary: "Statuts de bien (Disponible, Occupé, ...)" })
  async getPropertyStatuses() {
    return this.referencesService.getPropertyStatuses();
  }

  @Get('unit-types')
  @ApiOperation({ summary: "Types d'unites (Studio, Chambre-Salon, ...)" })
  async getUnitTypes() {
    return this.referencesService.getUnitTypes();
  }

  @Get('unit-features')
  @ApiOperation({ summary: "Équipements disponibles (avec icônes)" })
  async getUnitFeatures() {
    return this.referencesService.getUnitFeatures();
  }

  @Get('types')
  @ApiOperation({ summary: "Types du moteur (optionnel: categoryId pour filtrer)" })
  async getTypes(@Query('categoryId') categoryId?: string) {
    return this.referencesService.getTypes(categoryId || undefined);
  }

  @Get('types/:id/features')
  @ApiOperation({ summary: "Équipements moteur pour un type donné" })
  async getFeaturesByTypeId(@Param('id') id: string) {
    return this.referencesService.getFeaturesByTypeId(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — ref_categories
  // ————————————————————————————————————————————————————————————

  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Créer une catégorie (Admin)" })
  async createCategory(@Body() body: { code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createCategory(body);
  }

  @Put('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Modifier une catégorie (Admin)" })
  async updateCategory(@Param('id') id: string, @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.updateCategory(id, body);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer une catégorie (Admin)" })
  async deleteCategory(@Param('id') id: string) {
    await this.referencesService.deleteCategory(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — property_types
  // ————————————————————————————————————————————————————————————

  @Post('admin/property-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Créer un type de bâtiment (Admin)" })
  async createPropertyType(@Body() body: { code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createPropertyType(body);
  }

  @Put('admin/property-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Modifier un type de bâtiment (Admin)" })
  async updatePropertyType(
    @Param('id') id: string,
    @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number },
  ) {
    return this.referencesService.updatePropertyType(id, body);
  }

  @Delete('admin/property-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer un type de bâtiment (Admin)" })
  async deletePropertyType(@Param('id') id: string) {
    await this.referencesService.deletePropertyType(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — property_statuses
  // ————————————————————————————————————————————————————————————

  @Post('admin/property-statuses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Créer un statut de bien (Admin)" })
  async createPropertyStatus(@Body() body: { code: string; label_fr: string; label_en?: string; color?: string; sort_order?: number }) {
    return this.referencesService.createPropertyStatus(body);
  }

  @Put('admin/property-statuses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Modifier un statut de bien (Admin)" })
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body() body: { code?: string; label_fr?: string; label_en?: string; color?: string; sort_order?: number },
  ) {
    return this.referencesService.updatePropertyStatus(id, body);
  }

  @Delete('admin/property-statuses/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer un statut de bien (Admin)" })
  async deletePropertyStatus(@Param('id') id: string) {
    await this.referencesService.deletePropertyStatus(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — ref_types (moteur)
  // ————————————————————————————————————————————————————————————

  @Post('admin/types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Créer un type moteur (Admin)" })
  async createType(@Body() body: { ref_category_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createType(body);
  }

  @Put('admin/types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Modifier un type moteur (Admin)" })
  async updateType(@Param('id') id: string, @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.updateType(id, body);
  }

  @Delete('admin/types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer un type moteur (Admin)" })
  async deleteType(@Param('id') id: string) {
    await this.referencesService.deleteType(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — ref_features (moteur)
  // ————————————————————————————————————————————————————————————

  @Post('admin/features')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Créer un équipement moteur (Admin)" })
  async createFeature(@Body() body: { ref_type_id: string; code: string; label_fr: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.createFeature(body);
  }

  @Put('admin/features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Modifier un équipement moteur (Admin)" })
  async updateFeature(@Param('id') id: string, @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number }) {
    return this.referencesService.updateFeature(id, body);
  }

  @Delete('admin/features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer un équipement moteur (Admin)" })
  async deleteFeature(@Param('id') id: string) {
    await this.referencesService.deleteFeature(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — unit_types
  // ————————————————————————————————————————————————————————————

  @Post('admin/unit-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Creer un type d'unite (Admin)" })
  async createUnitType(@Body() body: { code: string; label_fr: string; label_en?: string; sort_order?: number; property_type_id?: string }) {
    return this.referencesService.createUnitType(body);
  }

  @Put('admin/unit-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Modifier un type d'unite (Admin)" })
  async updateUnitType(
    @Param('id') id: string,
    @Body() body: { code?: string; label_fr?: string; label_en?: string; sort_order?: number; property_type_id?: string | null },
  ) {
    return this.referencesService.updateUnitType(id, body);
  }

  @Delete('admin/unit-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer un type d'unite (Admin)" })
  async deleteUnitType(@Param('id') id: string) {
    await this.referencesService.deleteUnitType(id);
  }

  // ————————————————————————————————————————————————————————————
  // CRUD ADMIN — unit_features (équipements enrichis)
  // ————————————————————————————————————————————————————————————

  @Post('admin/unit-features')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Creer un equipement d'unite avec icone (Admin)" })
  async createUnitFeature(
    @Body()
    body: {
      code: string;
      label_fr: string;
      label_en?: string;
      sort_order?: number;
      icon_lucide?: string | null;
      icon_svg?: string | null;
    },
  ) {
    return this.referencesService.createUnitFeature(body);
  }

  @Put('admin/unit-features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Modifier un equipement d'unite (Admin)" })
  async updateUnitFeature(
    @Param('id') id: string,
    @Body()
    body: {
      code?: string;
      label_fr?: string;
      label_en?: string;
      sort_order?: number;
      icon_lucide?: string | null;
      icon_svg?: string | null;
    },
  ) {
    return this.referencesService.updateUnitFeature(id, body);
  }

  @Delete('admin/unit-features/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Supprimer un equipement d'unite (Admin)" })
  async deleteUnitFeature(@Param('id') id: string) {
    await this.referencesService.deleteUnitFeature(id);
  }
}
