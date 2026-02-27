/**
 * Service de chiffrement AES-256-GCM pour données sensibles.
 * Clé dérivée par utilisateur : MASTER_KEY + user.encryption_salt (pbkdf2).
 * Format stocké : hex(iv:authTag:ciphertext).
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha256';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private masterKey: Buffer | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const raw = this.configService.get<string>('encryption.key');
    if (!raw || raw.length < 16) {
      this.logger.warn(
        'Clé de chiffrement (encryption.key ou ENCRYPTION_KEY) absente ou trop courte ; le service ne chiffrera pas.',
      );
      return;
    }
    this.masterKey = Buffer.from(raw, 'utf8').subarray(0, 64);
  }

  /**
   * Dérive une clé de 32 octets à partir de la master key et du salt utilisateur.
   */
  private deriveKey(salt: string): Buffer {
    if (!this.masterKey) throw new Error('EncryptionService: clé non configurée');
    return crypto.pbkdf2Sync(
      this.masterKey,
      Buffer.from(salt, 'utf8'),
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST,
    );
  }

  /**
   * Chiffre une chaîne. salt = user.encryption_salt.
   * Retourne une chaîne hex (iv + authTag + ciphertext).
   */
  encrypt(plaintext: string, salt: string): string {
    if (!this.masterKey) {
      this.logger.warn('EncryptionService: clé non configurée, retour du texte en clair.');
      return plaintext;
    }
    if (!salt?.length) {
      this.logger.warn('EncryptionService: salt absent, chiffrement refusé.');
      return plaintext;
    }
    try {
      const key = this.deriveKey(salt);
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([iv, authTag, encrypted]).toString('hex');
    } catch (error) {
      this.logger.error(`Erreur chiffrement: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Déchiffre une chaîne produite par encrypt(plaintext, salt).
   * Le salt doit être le même que celui utilisé à l'encryption.
   */
  decrypt(cipherHex: string, salt: string): string {
    if (!this.masterKey) {
      this.logger.warn('EncryptionService: clé non configurée, retour du texte tel quel.');
      return cipherHex;
    }
    if (!salt?.length) {
      this.logger.warn('EncryptionService: salt absent, déchiffrement refusé.');
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
      const key = this.deriveKey(salt);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
      decipher.setAuthTag(authTag);
      return decipher.update(ciphertext) + decipher.final('utf8');
    } catch (error) {
      this.logger.error(`Erreur déchiffrement: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Crée une empreinte (hash déterministe) pour permettre 
   * la recherche d'unicité (Blind Index) sur des données chiffrées.
   */
  hash(plaintext: string): string {
    if (!this.masterKey) return plaintext;
    const hmac = crypto.createHmac('sha256', this.masterKey);
    hmac.update(plaintext, 'utf8');
    return hmac.digest('hex');
  }

  isConfigured(): boolean {
    return this.masterKey !== null;
  }
}
