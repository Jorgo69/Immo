import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType } from '../entities/notification.entity';
import { PushSubscriptionEntity } from '../entities/push-subscription.entity';
import { UserModel } from '../../auth/models/user.model/user.model';
import * as webpush from 'web-push';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(PushSubscriptionEntity)
    private readonly subscriptionRepo: Repository<PushSubscriptionEntity>,
    @InjectRepository(UserModel)
    private readonly userRepo: Repository<UserModel>,
    private readonly configService: ConfigService,
  ) {
    this.initWebPush();
  }

  private initWebPush() {
    const vapidKeys = {
      publicKey: this.configService.get<string>('notifications.vapidPublicKey'),
      privateKey: this.configService.get<string>('notifications.vapidPrivateKey'),
    };

    if (vapidKeys.publicKey && vapidKeys.privateKey) {
      webpush.setVapidDetails(
        'mailto:support@immo-benin.bj',
        vapidKeys.publicKey,
        vapidKeys.privateKey,
      );
      this.logger.log('WebPush VAPID details set successfully');
    } else {
      this.logger.warn('WebPush VAPID keys not found. Push notifications will be disabled.');
    }
  }

  /**
   * Envoie une notification à un utilisateur sur tous les canaux activés.
   */
  async notify(userId: string, data: {
    title_fr: string;
    title_en: string;
    message_fr: string;
    message_en: string;
    type?: NotificationType;
    metadata?: any;
  }) {
    const type = data.type || NotificationType.INFO;

    // 1. Sauvegarder en base (In-App)
    const notification = this.notificationRepo.create({
      userId,
      ...data,
      type,
    });
    await this.notificationRepo.save(notification);

    // 2. Envoyer par Web Push
    await this.sendPushNotification(userId, data);

    // TODO: Envoyer par Email/SMS/WhatsApp selon les préférences (Epic future)
    
    this.logger.log(`Notification sent to user ${userId}: ${data.title_fr}`);
  }

  private async sendPushNotification(userId: string, data: any) {
    const subscriptions = await this.subscriptionRepo.find({ where: { userId } });
    if (subscriptions.length === 0) return;

    // Récupérer la langue préférée de l'utilisateur
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const lang = user?.preferred_lang || 'fr';

    const payload = JSON.stringify({
      notification: {
        title: lang === 'en' ? data.title_en : data.title_fr,
        body: lang === 'en' ? data.message_en : data.message_fr,
        icon: '/favicon.ico',
        badge: '/vite.svg',
        data: {
          url: '/admin/profile', 
          ...data.metadata,
        }
      }
    });

    const tasks = subscriptions.map(sub => 
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      ).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          this.logger.warn(`Push subscription expired for user ${userId}, deleting...`);
          return this.subscriptionRepo.delete(sub.id);
        }
        this.logger.error(`Error sending push notification: ${err.message}`);
      })
    );

    await Promise.all(tasks);
  }

  /**
   * Récupère toutes les notifications d'un utilisateur.
   */
  async findAll(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Marquer une notification comme lue.
   */
  async markAsRead(userId: string, id: string) {
    await this.notificationRepo.update({ id, userId }, { isRead: true });
  }

  /**
   * Supprimer toutes les notifications d'un utilisateur.
   */
  async clearAll(userId: string) {
    await this.notificationRepo.delete({ userId });
  }

  /**
   * Enregistre un nouvel abonnement Push.
   */
  async subscribe(userId: string, subscription: any, userAgent?: string) {
    // Vérifier si l'abonnement existe déjà pour cet endpoint
    const existing = await this.subscriptionRepo.findOne({ 
      where: { endpoint: subscription.endpoint } 
    });

    if (existing) {
      existing.userId = userId;
      existing.userAgent = userAgent;
      await this.subscriptionRepo.save(existing);
      return;
    }

    const newSub = this.subscriptionRepo.create({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      expirationTime: subscription.expirationTime,
      userAgent,
    });

    await this.subscriptionRepo.save(newSub);
  }
}
