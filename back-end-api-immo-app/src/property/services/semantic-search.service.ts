/**
 * Service sémantique — client HTTP vers le microservice Python FastAPI.
 *
 * Quand l’URL est configurée (app.semanticUrl), le backend peut appeler
 * POST /embed sur ce service pour générer des vecteurs.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);
  private readonly baseUrl: string | null;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('app.semanticUrl') ?? null;
    if (!this.baseUrl) {
      this.logger.log('SemanticSearchService: aucune URL configurée, recherche IA désactivée.');
    } else {
      this.logger.log(`SemanticSearchService initialisé avec ${this.baseUrl}`);
    }
  }

  isReady(): boolean {
    return !!this.baseUrl;
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.isReady()) {
      this.logger.warn(
        'SemanticSearchService appelé sans provider configuré — fallback texte uniquement.',
      );
      return [];
    }
    try {
      const url = `${this.baseUrl}/embed`;
      const res = await axios.post<{ vectors: number[][] }>(url, { texts: [text] });
      const [vec] = res.data.vectors ?? [];
      if (!vec) {
        this.logger.warn('SemanticSearchService: embedding vide retourné par le service Python.');
        return [];
      }
      return vec;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l’appel au service d’embed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }
}

