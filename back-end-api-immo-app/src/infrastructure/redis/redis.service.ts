import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('redis.host', '127.0.0.1');
    const port = this.configService.get<number>('redis.port', 6379);

    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connecté à Redis sur ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Erreur de connexion Redis : ${err.message}`);
    });

    // Optionnel: Connexion asynchrone pour ne pas bloquer le démarrage de NestJS
    this.client.connect().catch((err) => {
      this.logger.warn(`L'application démarre sans Redis (non critique) : ${err.message}`);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.quit();
      this.logger.log('Déconnexion de Redis');
    }
  }

  /**
   * Enregistre une valeur dans Redis.
   * @param key Clé d'enregistrement
   * @param value Valeur (Sera stringifiée si c'est un objet)
   * @param ttlSeconds Durée de vie en secondes (optionnel)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (ttlSeconds) {
        await this.client.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (err) {
      this.logger.error(`Erreur lors du set Redis pour la clé ${key} : ${err}`);
    }
  }

  /**
   * Récupère une valeur typée depuis Redis
   * @param key Clé d'enregistrement
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const result = await this.client.get(key);
      if (!result) return null;
      try {
        return JSON.parse(result) as T;
      } catch {
        return result as unknown as T;
      }
    } catch (err) {
      this.logger.error(`Erreur lors du get Redis pour la clé ${key} : ${err}`);
      return null;
    }
  }

  /**
   * Supprime une clé de Redis
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Erreur lors du del Redis pour la clé ${key} : ${err}`);
    }
  }
}
