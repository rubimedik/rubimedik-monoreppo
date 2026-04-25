import { Not, IsNull, In, Repository, DataSource } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { SpecialistsService } from '../specialists/specialists.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { ConsultationsService } from '../consultations/consultations.service';
import { DonationsService } from '../donations/donations.service';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType, UserRole, DonationStatus, ConsultationStatus, PayoutStatus } from '@repo/shared';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private usersService: UsersService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private specialistsService: SpecialistsService,
    private hospitalsService: HospitalsService,
    private consultationsService: ConsultationsService,
    private donationsService: DonationsService,
    private walletService: WalletService,
    private dataSource: DataSource,
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getStats() {
    const [users, specialists, hospitals, consultations, requests, matches] = await Promise.all([
      this.usersService.findAll(),
      this.specialistsService.findAll(),
      this.hospitalsService.findAll(),
      this.consultationsService.findAll(),
      this.donationsService.findAllRequests(),
      this.donationsService.findAllMatches(),
    ]);

    const totalHospitals = users.filter(u => u.roles.includes(UserRole.HOSPITAL)).length;
    const totalSpecialists = users.filter(u => u.roles.includes(UserRole.SPECIALIST)).length;
    const totalDonors = users.filter(u => u.roles.includes(UserRole.DONOR)).length;
    const totalPatients = users.filter(u => u.roles.includes(UserRole.PATIENT)).length;

    const revenue = consultations
      .filter(c => c.payoutStatus === PayoutStatus.PAID)
      .reduce((acc, curr) => acc + Number(curr.platformFee), 0);

    const pendingRequests = requests.filter(r => r.status === DonationStatus.PENDING).length;
    const completedDonations = matches.filter(m => m.status === DonationStatus.VERIFIED || m.status === DonationStatus.COMPLETED).length;

    // Redis Health Check
    let redisStatus = 'Disconnected';
    try {
      const ping = await this.redis.ping();
      if (ping === 'PONG') redisStatus = 'Operational';
    } catch (err) {
      this.logger.error('Redis Health Check Failed', err);
      redisStatus = 'Error';
    }

    return {
      totalUsers: users.length,
      totalSpecialists,
      totalHospitals,
      totalDonors,
      totalPatients,
      totalConsultations: consultations.length,
      totalDonations: completedDonations,
      totalRequests: requests.length,
      pendingRequests,
      totalRevenue: revenue,
      redisStatus,
    };
  }

  async getRecentActivities() {
    try {
      const [users, consultations, matches] = await Promise.all([
        this.usersService.findAll(),
        this.consultationsService.findAll(),
        this.donationsService.findAllMatches(),
      ]);

      const activities = [
        ...users.map(u => ({ type: 'user_signup', date: u.createdAt, data: u })),
        ...consultations.map(c => ({ type: 'consultation_booked', date: c.createdAt, data: c })),
        ...matches.map(m => ({ type: 'donation_match', date: m.createdAt, data: m })),
      ];

      return activities.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
          const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
          return dateB - dateA;
      }).slice(0, 20);
    } catch (error) {
      this.logger.error('Failed to fetch recent activities', error.stack);
      return []; // Return empty list instead of failing entire dashboard
    }
  }

  async getUsers(page = 1, limit = 10, role?: UserRole) {
    const users = await this.usersService.findAll();
    let filtered = users;
    if (role) {
      filtered = users.filter(u => u.roles.includes(role));
    }
    
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async getConsultations(page = 1, limit = 10) {
    const consultations = await this.consultationsService.findAll();
    const total = consultations.length;
    const start = (page - 1) * limit;
    const items = consultations.slice(start, start + limit);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async getDonations(page = 1, limit = 10) {
    const donations = await this.donationsService.findAllRequests();
    const total = donations.length;
    const start = (page - 1) * limit;
    const items = donations.slice(start, start + limit);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async getDonationMatches(page = 1, limit = 10) {
    const matches = await this.donationsService.findAllMatches();
    const total = matches.length;
    const start = (page - 1) * limit;
    const items = matches.slice(start, start + limit);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async getPayouts(page = 1, limit = 10) {
    const payouts = await this.walletService.findAllTransactions(TransactionType.TRANSFER_OUT);
    const total = payouts.length;
    const start = (page - 1) * limit;
    const items = payouts.slice(start, start + limit);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async deleteUser(id: string) {
    return this.usersRepository.delete(id);
  }

  async bulkDeleteUsers(ids: string[]) {
    return this.usersRepository.delete({ id: In(ids) });
  }

  async deleteConsultation(id: string) {
    return this.dataSource.getRepository('consultations').delete(id);
  }

  async bulkDeleteConsultations(ids: string[]) {
    return this.dataSource.getRepository('consultations').delete({ id: In(ids) });
  }

  async deleteDonation(id: string) {
    return this.donationsService.deleteRequestAdmin(id);
  }

  async bulkDeleteDonations(ids: string[]) {
    return this.donationsService.bulkDeleteRequests(ids);
  }

  async deleteReferral(id: string) {
    return this.usersRepository.update(id, { referredById: null });
  }

  async bulkDeleteReferrals(ids: string[]) {
    return this.usersRepository.update({ id: In(ids) }, { referredById: null });
  }

  async getReferrals(page = 1, limit = 10) {
    const invites = await this.usersService.findAll();
    const referredUsers = invites.filter(u => u.referredById !== null && u.referredById !== undefined);

    const results = await Promise.all(referredUsers.map(async (u) => {
        const consultationCount = await this.dataSource.getRepository('consultations').count({
            where: { patient: { id: u.id }, status: 'COMPLETED' } as any
        });
        
        const referrer = invites.find(r => r.id === u.referredById);

        return {
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            createdAt: u.createdAt,
            status: consultationCount > 0 ? 'COMPLETED' : 'PENDING_CONSULTATION',
            rewardAmount: Number(this.configService.get('REFERRAL_POINT_VALUE') || 500),
            referrer: referrer ? {
                id: referrer.id,
                fullName: referrer.fullName,
                email: referrer.email
            } : null
        };
    }));

    const total = results.length;
    const start = (page - 1) * limit;
    const items = results.slice(start, start + limit);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async updateUserVerification(userId: string, isVerified: boolean) {
    return this.usersService.update(userId, { isVerified });
  }

  async getConsultationDetail(id: string) {
    return this.consultationsService.findOne(id);
  }

  async updateConsultationStatus(id: string, status: string, note?: string) {
    return this.dataSource.getRepository('consultations').update(id, { 
        status: status as any,
        payoutNote: note || 'Manually updated by administrator'
    });
  }

  async approvePayout(id: string) {
    return this.consultationsService.executePayoutLogicForScheduler(id);
  }

  async refundConsultation(id: string, adminNote: string) {
    return this.consultationsService.adminRefundConsultation(id, adminNote);
  }

  async getEarnings(period: 'today' | '7days' | '1month' | 'all') {
    const query = this.dataSource.getRepository('consultations').createQueryBuilder('consultation')
      .where('consultation.status IN (:...statuses)', { 
          statuses: [ConsultationStatus.COMPLETED, ConsultationStatus.ARCHIVED] 
      })
      .andWhere('consultation.payoutStatus = :payoutStatus', { payoutStatus: PayoutStatus.PAID });

    const now = new Date();
    if (period === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0));
      query.andWhere('consultation.updatedAt >= :start', { start });
    } else if (period === '7days') {
      const start = new Date(now.setDate(now.getDate() - 7));
      query.andWhere('consultation.updatedAt >= :start', { start });
    } else if (period === '1month') {
      const start = new Date(now.setMonth(now.getMonth() - 1));
      query.andWhere('consultation.updatedAt >= :start', { start });
    }

    const consultations = await query.getMany();
    
    const totalEarnings = consultations.reduce((acc, curr) => acc + Number(curr.platformFee), 0);
    const totalConsultationValue = consultations.reduce((acc, curr) => acc + Number(curr.totalFee), 0);
    const totalSpecialistPayouts = consultations.reduce((acc, curr) => acc + Number(curr.specialistPayout), 0);

    return {
      period,
      totalEarnings,
      totalConsultationValue,
      totalSpecialistPayouts,
      consultationCount: consultations.length
    };
  }
}
