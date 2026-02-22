/**
 * Service de domaine (ARCHITECTURE §1, §9) : upload d'image pour un bien (Property).
 * Enregistre le fichier dans uploads/properties/ et retourne un chemin consommable par le Front.
 * - En prod : BACKEND_URL défini → URL absolue (ex: https://api.immo-benin.com/uploads/properties/xxx.jpg).
 * - En dev / sans BACKEND_URL : chemin relatif /uploads/properties/xxx.jpg ; le Front préfixe avec VITE_API_BASE_URL (proxy).
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = 'uploads/properties';
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class UploadPropertyImageService {
  /**
   * Enregistre le fichier sur disque et retourne l'URL à renvoyer au client.
   * @param file - Fichier multipart (buffer, size, mimetype, originalname)
   * @returns url : chemin relatif /uploads/properties/xxx ou URL absolue si BACKEND_URL est défini
   */
  async saveImage(
    file: { buffer: Buffer; size: number; mimetype: string; originalname: string },
  ): Promise<{ url: string }> {
    if (!file?.buffer) {
      throw new BadRequestException('Fichier manquant');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 5 Mo)');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Format non autorisé (JPEG, PNG, WebP, GIF uniquement)');
    }

    const ext = this.getExtension(file.originalname, file.mimetype);
    const filename = `${randomUUID()}-${Date.now()}.${ext}`;
    const dir = join(process.cwd(), UPLOAD_DIR);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const filepath = join(dir, filename);
    writeFileSync(filepath, file.buffer);

    const urlPath = `/${UPLOAD_DIR}/${filename}`;
    const backendUrl = process.env.BACKEND_URL;
    const url = backendUrl
      ? (backendUrl.endsWith('/') ? backendUrl.slice(0, -1) + urlPath : backendUrl + urlPath)
      : urlPath;

    return { url };
  }

  /**
   * Déduit l'extension sûre à partir du nom ou du mimetype.
   */
  private getExtension(originalname: string, mimetype: string): string {
    const fromName = originalname?.split('.').pop()?.toLowerCase();
    if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
      return fromName === 'jpeg' ? 'jpg' : fromName;
    }
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return map[mimetype] || 'jpg';
  }
}
