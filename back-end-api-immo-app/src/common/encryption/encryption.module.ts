/**
 * Module partagé : chiffrement AES-256-GCM pour données sensibles.
 */
import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
