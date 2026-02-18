/**
 * Service de chiffrement centralisé AES-256-GCM pour données sensibles
 * (noms, téléphones, documents, relevés compteurs — cf. .cursorrules).
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private key: Buffer | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const raw = this.configService.get<string>('encryption.key');
    if (!raw || raw.length < KEY_LENGTH) {
      this.logger.warn(
        'Clé de chiffrement absente ou trop courte ; le service ne chiffrera pas. Configurer encryption.key (32 octets).',
      );
      return;
    }
    this.key = Buffer.from(raw.slice(0, KEY_LENGTH), 'utf8');
  }

  /**
   * Chiffre une chaîne en UTF-8. Retourne une chaîne hex (iv + authTag + ciphertext).
   */
  encrypt(plaintext: string): string {
    if (!this.key) {
      this.logger.warn('EncryptionService: clé non configurée, retour du texte en clair.');
      return plaintext;
    }
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([iv, authTag, encrypted]).toString('hex');
    } catch (error) {
      this.logger.error(`Erreur chiffrement: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Déchiffre une chaîne produite par encrypt().
   */
  decrypt(cipherHex: string): string {
    if (!this.key) {
      this.logger.warn('EncryptionService: clé non configurée, retour du texte tel quel.');
      return cipherHex;
    }
    try {
      const buf = Buffer.from(cipherHex, 'hex');
      if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error('Données chiffrées invalides');
      }
      const iv = buf.subarray(0, IV_LENGTH);
      const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
      decipher.setAuthTag(authTag);
      return decipher.update(ciphertext) + decipher.final('utf8');
    } catch (error) {
      this.logger.error(`Erreur déchiffrement: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.key !== null;
  }
}
