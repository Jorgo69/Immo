import { Controller, Post, Body, UseGuards, Req, Get, Patch, Param, Delete } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { NotificationType } from './entities/notification.entity';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer un abonnement Web Push' })
  async subscribe(@Req() req, @Body() subscription: any) {
    const userAgent = req.headers['user-agent'];
    await this.notificationService.subscribe(req.user.id, subscription, userAgent);
    return { success: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer l\'historique des notifications' })
  async findAll(@Req() req) {
    return this.notificationService.findAll(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@Req() req, @Param('id') id: string) {
    await this.notificationService.markAsRead(req.user.id, id);
    return { success: true };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vider l\'historique des notifications' })
  async clearAll(@Req() req) {
    await this.notificationService.clearAll(req.user.id);
    return { success: true };
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envoyer une notification de test' })
  async test(@Req() req) {
    await this.notificationService.notify(req.user.id, {
      title_fr: 'Test de Notification 🔔',
      title_en: 'Notification Test 🔔',
      message_fr: 'Ceci est une notification de test pour vérifier votre configuration.',
      message_en: 'This is a test notification to verify your configuration.',
      type: NotificationType.INFO,
    });
    return { success: true };
  }
}
