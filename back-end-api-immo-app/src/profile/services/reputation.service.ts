/**
 * Reputation Service — Gère le calcul et la mise à jour du score de confiance.
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity, KycStatus } from '../entities/profile.entity';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
  ) {}

  /**
   * Recalcule le score d'un utilisateur selon son historique.
   * Logique initiale : 
   * - Base = 5.0
   * - KYC vérifié = maintien ou bonus
   * - KYC rejeté = pénalité
   * (À enrichir avec les paiements réels et signalements plus tard)
   */
  async updateReputationScore(userId: string): Promise<number> {
    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });
    if (!profile) return 5.0;

    let score = 5.0;

    // Pénalités / Bonus basés sur le KYC
    if (profile.kyc_status === KycStatus.REJECTED) {
      score -= 0.5;
    } else if (profile.kyc_status === KycStatus.VERIFIED) {
      score += 0.0; // Déjà au max par défaut
    }

    // Ici on pourra ajouter :
    // score -= (nombres_incidents * 1.0)
    // score += (nombre_paiements_a_temps * 0.1)

    // Clamp entre 0 et 5
    score = Math.max(0, Math.min(5, score));

    profile.reputation_score = score;
    
    // Badge de confiance auto si score très haut
    profile.trust_badge = score >= 4.8;

    await this.profileRepo.save(profile);
    this.logger.log(`Reputation score updated for user ${userId}: ${score}`);
    
    return score;
  }
}
