import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';

@ApiTags('Settings & Configurations')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // --- ACCES PUBLIC (APP INIT) ---

  @Get('public')
  @ApiOperation({ summary: 'Obtenir les configs systèmes publiques (Ex: mode maintenance, TVA)' })
  async getPublicConfigs() {
    return this.settingsService.getPublicConfigs();
  }

  // --- ACCES ADMIN ---

  @Get('admin/configs')
  @UseGuards(JwtAuthGuard)
  // TODO: Add @RolesGuard('admin') when RoleEntity is implemented
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister toutes les configurations système (Réservé Admin)' })
  async getAllConfigs() {
    return this.settingsService.getAllConfigs();
  }

  @Patch('admin/configs/:key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une configuration système existante (Admin)' })
  async updateConfig(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.updateConfig(key, value);
  }

  // --- ACCES UTILISATEUR CONNECTÉ ---

  @Get('me/notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Voir mes préférences de notifications (Email, SMS...)' })
  async getMyNotifPreferences(@Request() req) {
    return this.settingsService.getUserPreferences(req.user.id);
  }

  @Patch('me/notifications/:channel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activer ou désactiver un canal de notification' })
  async updateMyNotifPreference(
    @Request() req,
    @Param('channel') channel: string,
    @Body('is_enabled') isEnabled: boolean,
  ) {
    return this.settingsService.updateUserPreference(req.user.id, channel, isEnabled);
  }
}
