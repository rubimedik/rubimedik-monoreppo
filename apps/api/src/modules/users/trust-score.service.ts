import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class TrustScoreService {
  private readonly logger = new Logger(TrustScoreService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // PATIENT SCORE UPDATES
  async updatePatientScore(userId: string, action: 'COMPLETED_CONSULTATION' | 'REFUND_REQUEST' | 'CHARGEBACK' | 'REVIEW_SUBMITTED' | 'FLAGGED_REVIEW' | 'DAILY_AGE') {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;

    let delta = 0;
    switch (action) {
      case 'COMPLETED_CONSULTATION': delta = 2; break;
      case 'REFUND_REQUEST': delta = -10; break;
      case 'CHARGEBACK': delta = -25; break;
      case 'REVIEW_SUBMITTED': delta = 1; break;
      case 'FLAGGED_REVIEW': delta = -15; break;
      case 'DAILY_AGE': delta = 0.1; break;
    }

    user.trustScore = Math.min(100, Math.max(0, user.trustScore + delta));
    await this.usersRepository.save(user);

    this.enforcePatientRestrictions(user);
  }

  private enforcePatientRestrictions(user: User) {
    if (user.trustScore < 10) {
      // Suspend account
      this.logger.warn(`Patient ${user.id} trust score dropped below 10. Account suspended.`);
      // Implement suspension logic (e.g. user.isActive = false)
    } else if (user.trustScore < 30) {
      this.logger.warn(`Patient ${user.id} trust score below 30. Manual approval required.`);
    } else if (user.trustScore < 50) {
      this.logger.warn(`Patient ${user.id} trust score below 50. Wallet funding required.`);
    }
  }

  // SPECIALIST SCORE UPDATES
  async updateSpecialistScore(userId: string, action: 'COMPLETED_CONSULTATION' | 'GHOST_FLAG' | 'OFF_PLATFORM_FLAG' | 'CLEAN_PAYOUT' | 'COLLUSION_FLAG', rating?: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;

    let delta = 0;
    switch (action) {
      case 'COMPLETED_CONSULTATION': delta = 3; break;
      case 'GHOST_FLAG': delta = -20; break;
      case 'OFF_PLATFORM_FLAG': delta = -30; break;
      case 'CLEAN_PAYOUT': delta = 1; break;
      case 'COLLUSION_FLAG': delta = -50; break;
    }

    if (rating !== undefined) {
      // Simple weighted adjustment: >3 gives small boost, <3 gives penalty
      delta += (rating - 3) * 1.5; 
    }

    user.trustScore = Math.min(100, Math.max(0, user.trustScore + delta));
    await this.usersRepository.save(user);

    this.enforceSpecialistRestrictions(user);
  }

  private enforceSpecialistRestrictions(user: User) {
    if (user.trustScore < 20) {
      this.logger.warn(`Specialist ${user.id} trust score below 20. Suspend and investigate.`);
      // Implement suspension logic
    } else if (user.trustScore < 40) {
      this.logger.warn(`Specialist ${user.id} trust score below 40. Manual payout approval required.`);
    } else if (user.trustScore < 60) {
      this.logger.warn(`Specialist ${user.id} trust score below 60. Delayed payouts applied.`);
    }
  }
}
