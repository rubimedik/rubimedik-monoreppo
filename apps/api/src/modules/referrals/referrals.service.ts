import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { ReferralCode } from './entities/referral-code.entity';
import { User } from '../users/entities/user.entity';
import { ReferralStatus, UrgencyLevel } from '@repo/shared';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private referralsRepository: Repository<Referral>,
    @InjectRepository(ReferralCode)
    private referralCodesRepository: Repository<ReferralCode>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findByCode(code: string): Promise<ReferralCode> {
    const referralCode = await this.referralCodesRepository.findOne({
      where: { code },
      relations: ['user'],
    });
    if (!referralCode) {
      throw new NotFoundException('Referral code not found');
    }
    return referralCode;
  }

  async getMyReferrals(userId: string): Promise<Referral[]> {
    return this.referralsRepository.find({
      where: [{ specialist: { id: userId } }, { patient: { id: userId } }, { hospital: { id: userId } }],
      relations: ['specialist', 'patient', 'hospital'],
    });
  }

  async createReferral(data: { 
    specialistId: string, 
    patientId: string, 
    hospitalId: string, 
    reason: string, 
    urgency: UrgencyLevel 
  }) {
    const hospitalProfile = await this.dataSource.getRepository('hospital_profiles').findOne({
      where: { user: { id: data.hospitalId } }
    }) as any;

    if (!hospitalProfile?.isApproved) {
      throw new BadRequestException('Hospital is not approved yet to receive referrals');
    }

    const referral = new Referral();
    referral.specialist = { id: data.specialistId } as any;
    referral.patient = { id: data.patientId } as any;
    referral.hospital = { id: data.hospitalId } as any;
    referral.reason = data.reason;
    referral.urgency = data.urgency;
    referral.status = ReferralStatus.SENT;

    return this.referralsRepository.save(referral);
  }

  
  
  async getInvitedUsers(userId: string) {
    const invites = await this.usersRepository.find({
      where: { referredById: userId },
      select: ['id', 'fullName', 'email', 'createdAt', 'isVerified'],
      order: { createdAt: 'DESC' }
    });
    
    const results = await Promise.all(invites.map(async (u) => {
        // Find if this user has any completed consultation as a patient
        // We look for consultations where u.id is the patient's user id
        const consultationCount = await this.dataSource.getRepository('consultations').count({
            where: { patient: { id: u.id }, status: 'COMPLETED' } as any
        });
        
        return {
            ...u,
            status: consultationCount > 0 ? 'COMPLETED' : 'PENDING_CONSULTATION'
        };
    }));
    
    return results;
  }

  async getLeaderboard() {
    // This query gets top 10 users with most referred users
    const query = this.usersRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .addSelect('user.fullName', 'fullName')
      .addSelect('user.avatarUrl', 'avatarUrl')
      .addSelect('COUNT(referrals.id)', 'referralCount')
      .innerJoin('users', 'referrals', 'referrals.referredById = user.id')
      .groupBy('user.id')
      .orderBy('"referralCount"', 'DESC')
      .limit(10);
      
    return query.getRawMany();
  }


  async updateStatus(id: string, status: ReferralStatus) {
    const referral = await this.referralsRepository.findOne({ where: { id } });
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }
    referral.status = status;
    return this.referralsRepository.save(referral);
  }
}
