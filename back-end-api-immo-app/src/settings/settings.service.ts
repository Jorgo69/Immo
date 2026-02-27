import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigType, SystemConfigEntity } from './entities/system-config.entity';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SystemConfigEntity)
    private readonly configRepo: Repository<SystemConfigEntity>,
    @InjectRepository(NotificationPreferenceEntity)
    private readonly notifPrefRepo: Repository<NotificationPreferenceEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultConfigs();
  }

  /**
   * Initialise les configurations vitales du système au démarrage 
   * si elles n'existent pas encore dans PostgreSQL.
   */
  private async seedDefaultConfigs() {
    const defaults = [
      { key: 'enable_sms', value: 'true', type: ConfigType.BOOLEAN, description: 'Activer les notifications par SMS', is_public: false },
      { key: 'enable_email', value: 'true', type: ConfigType.BOOLEAN, description: 'Activer les notifications par Email', is_public: false },
      { key: 'enable_whatsapp', value: 'true', type: ConfigType.BOOLEAN, description: 'Activer les notifications par WhatsApp', is_public: false },
      { key: 'maintenance_mode', value: 'false', type: ConfigType.BOOLEAN, description: 'Mode Maintenance (bloque les accès utilisateurs)', is_public: true },
      { key: 'kyc_auto_approve_tenant', value: 'true', type: ConfigType.BOOLEAN, description: 'Approuver automatiquement les KYC Locataires (Locataire simple)', is_public: false },
      { key: 'days_before_inactive', value: '90', type: ConfigType.NUMBER, description: 'Nombre de jours avant de restreindre un compte inactif', is_public: false },
      { key: 'days_before_hard_delete', value: '30', type: ConfigType.NUMBER, description: 'Jours avant suppression physique d_un compte Soft Deleted', is_public: false },
      { key: 'tax_rate_percent', value: '18', type: ConfigType.NUMBER, description: 'TVA ou taxe plateforme par défaut (%)', is_public: true },
    ];

    for (const conf of defaults) {
      const exists = await this.configRepo.findOne({ where: { key: conf.key } });
      if (!exists) {
        const entity = this.configRepo.create(conf);
        await this.configRepo.save(entity);
        this.logger.log(`[Config Seed] ${conf.key} inséré par défaut.`);
      }
    }
  }

  // --- ADMINISTRATION : GERER LES CONFIGURATIONS SYSTEMES ---

  async getAllConfigs() {
    return this.configRepo.find({ order: { key: 'ASC' } });
  }

  async getPublicConfigs() {
    return this.configRepo.find({ where: { is_public: true }, order: { key: 'ASC' } });
  }

  async updateConfig(key: string, value: string) {
    let config = await this.configRepo.findOne({ where: { key } });
    if (!config) {
      throw new Error(`Configuration avec la clé ${key} introuvable.`);
    }
    config.value = value;
    await this.configRepo.save(config);
    return config;
  }

  async getConfigValue(key: string): Promise<any> {
    const config = await this.configRepo.findOne({ where: { key } });
    if (!config) return null;

    if (config.type === ConfigType.BOOLEAN) return config.value === 'true';
    if (config.type === ConfigType.NUMBER) return Number(config.value);
    if (config.type === ConfigType.JSON) {
      try {
        return JSON.parse(config.value);
      } catch {
        return null;
      }
    }
    return config.value; // STRING
  }

  // --- UTILISATEUR : GERER SES PREFERENCES DE NOTIFICATION ---

  async getUserPreferences(userId: string) {
    const prefs = await this.notifPrefRepo.find({ where: { user_id: userId } });
    
    // Si l'utilisateur n'a jamais configuré, on lui retourne des valeurs par défaut virtuelles
    const channels = ['email', 'sms', 'push', 'whatsapp'];
    const result = {};
    
    for (const ch of channels) {
      const pref = prefs.find(p => p.channel === ch);
      result[ch] = pref ? pref.is_enabled : true; // Par défaut tout est activé
    }
    return result;
  }

  async updateUserPreference(userId: string, channel: string, isEnabled: boolean) {
    let pref = await this.notifPrefRepo.findOne({ where: { user_id: userId, channel } });
    if (!pref) {
      pref = this.notifPrefRepo.create({ user_id: userId, channel, is_enabled: isEnabled });
    } else {
      pref.is_enabled = isEnabled;
    }
    await this.notifPrefRepo.save(pref);
    return pref;
  }
}
