/**
 * Service d'upload d'avatar : écriture sur disque dans uploads/avatars/.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { UserModel } from '../auth/models/user.model/user.model';

const UPLOAD_DIR = 'uploads/avatars';
const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class UploadAvatarService {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepo: Repository<UserModel>,
  ) {}

  /**
   * Enregistre le fichier et met à jour avatar_url de l'utilisateur.
   * Retourne l'URL publique de l'avatar.
   */
  async saveAvatar(
    userId: string,
    file: { buffer: Buffer; size: number; mimetype: string; originalname: string },
    baseUrl: string,
  ): Promise<{ url: string }> {
    if (!file?.buffer) {
      throw new BadRequestException('Fichier manquant');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 3 Mo)');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Format non autorisé (JPEG, PNG, WebP, GIF uniquement)');
    }

    const ext = this.getExtension(file.originalname, file.mimetype);
    const filename = `${userId}-${Date.now()}.${ext}`;
    const dir = join(process.cwd(), UPLOAD_DIR);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const filepath = join(dir, filename);
    writeFileSync(filepath, file.buffer);

    const urlPath = `/${UPLOAD_DIR}/${filename}`;
    const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) + urlPath : baseUrl + urlPath;

    await this.userRepo.update({ id: userId }, { avatar_url: url });

    return { url };
  }

  private getExtension(originalname: string, mimetype: string): string {
    const fromName = originalname?.split('.').pop()?.toLowerCase();
    if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return map[mimetype] || 'jpg';
  }
}
