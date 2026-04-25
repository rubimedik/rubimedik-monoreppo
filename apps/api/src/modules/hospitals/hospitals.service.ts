import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { HospitalInventory } from './entities/hospital-inventory.entity';
import { HospitalProfile } from './entities/hospital-profile.entity';
import { BloodRequest } from '../donations/entities/blood-request.entity';
import { DonationMatch } from '../donations/entities/donation-match.entity';
import { UrgencyLevel, DonationStatus, UserRole } from '@repo/shared';
import { ActivitiesService } from '../activities/activities.service';
import { AiService } from '../ai/ai.service';
import { startOfWeek, startOfMonth, startOfYear, subDays } from 'date-fns';

@Injectable()
export class HospitalsService {
  private readonly logger = new Logger(HospitalsService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(HospitalInventory)
    private inventoryRepository: Repository<HospitalInventory>,
    @InjectRepository(HospitalProfile)
    private hospitalProfileRepository: Repository<HospitalProfile>,
    @InjectRepository(BloodRequest)
    private bloodRequestRepository: Repository<BloodRequest>,
    @InjectRepository(DonationMatch)
    private donationMatchRepository: Repository<DonationMatch>,
    private activitiesService: ActivitiesService,
    private aiService: AiService,
  ) {}

  async getInventoryPrediction(hospitalId: string, bloodType: string) {
      const historicalRequests = await this.bloodRequestRepository.find({
          where: { hospital: { id: hospitalId }, bloodType },
          order: { createdAt: 'DESC' },
          take: 20
      });

      const eligibleDonorsCount = await this.usersRepository.count({
          where: { activeRole: UserRole.DONOR, bloodGroup: bloodType }
      });

      const prediction = await this.aiService.predictBloodInventory(
          historicalRequests.map(r => ({ date: r.createdAt, units: r.units })),
          eligibleDonorsCount,
          bloodType
      );

      return prediction;
  }

  async findAll(): Promise<HospitalProfile[]> {
    return this.hospitalProfileRepository.find({ 
      where: { isApproved: true },
      relations: ['user'] 
    });
  }

  async findOne(id: string): Promise<HospitalProfile> {
    const profile = await this.hospitalProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Hospital profile not found');
    }
    return profile;
  }

  async findByUserId(userId: string): Promise<HospitalProfile> {
    const profile = await this.hospitalProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Hospital profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, data: any): Promise<HospitalProfile> {
    let profile = await this.hospitalProfileRepository.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!profile) {
      profile = new HospitalProfile();
      profile.user = { id: userId } as any;
      profile.hospitalName = data.hospitalName || 'New Hospital';
    }

    if (data.phoneNumber) {
      await this.usersRepository.update(userId, { phoneNumber: data.phoneNumber });
    }

    const { hospitalName, address, licenseNumber, documentUrl, phoneNumber } = data;
    Object.assign(profile, { hospitalName, address, licenseNumber, documentUrl, phoneNumber });
    
    const savedProfile = await this.hospitalProfileRepository.save(profile);
    
    await this.activitiesService.create(
      userId,
      'PROFILE_UPDATE',
      'Profile Updated',
      'You updated your hospital profile information.'
    );

    return savedProfile;
  }

  async getInventory(userId: string): Promise<HospitalInventory[]> {
    return this.inventoryRepository.find({
      where: { hospital: { id: userId } },
    });
  }

  async updateInventory(userId: string, bloodType: string, units: number): Promise<HospitalInventory> {
    let inventory = await this.inventoryRepository.findOne({
      where: { hospital: { id: userId }, bloodType },
    });

    if (!inventory) {
      inventory = this.inventoryRepository.create({
        hospital: { id: userId } as any,
        bloodType,
        units,
      });
    } else {
      inventory.units = units;
    }

    const savedInventory = await this.inventoryRepository.save(inventory);

    await this.activitiesService.create(
      userId,
      'INVENTORY_UPDATE',
      `Inventory Updated: ${bloodType}`,
      `You updated ${bloodType} inventory to ${units} units.`,
      { bloodType, units }
    );

    return savedInventory;
  }

  async getDashboardStats(userId: string, filter?: string) {
    this.logger.debug(`DEBUG STATS: Fetching for user ${userId} with filter "${filter}"`);
    
    let dateLimit: Date | null = null;
    const now = new Date();

    if (filter === 'This week') dateLimit = startOfWeek(now);
    else if (filter === 'This month') dateLimit = startOfMonth(now);
    else if (filter === 'This year') dateLimit = startOfYear(now);

    this.logger.debug(`DEBUG STATS: Date limit calculated: ${dateLimit ? dateLimit.toISOString() : 'None'}`);

    // 1. Active Requests (Hospital specific)
    const activeRequests = await this.bloodRequestRepository.count({
      where: { 
        hospital: { id: userId }, 
        status: DonationStatus.PENDING 
      }
    });

    // 2. Urgent Nearby (All platform requests)
    const urgentRequestsNearby = await this.bloodRequestRepository.count({
      where: [
        { urgency: UrgencyLevel.CRITICAL, status: DonationStatus.PENDING },
        { urgency: UrgencyLevel.URGENT, status: DonationStatus.PENDING }
      ]
    });

    // 3. Upcoming Donations (Matches waiting for or approved by hospital)
    const upcomingQuery = this.donationMatchRepository
      .createQueryBuilder('match')
      .innerJoin('match.request', 'request')
      .where('request.hospitalId = :userId', { userId })
      .andWhere('match.status IN (:...statuses)', { 
        statuses: [DonationStatus.PENDING, DonationStatus.ACCEPTED, DonationStatus.CONFIRMED] 
      });

    if (dateLimit) {
      // Filter by scheduledDate for upcoming appointments
      upcomingQuery.andWhere('match.scheduledDate >= :dateLimit', { dateLimit });
    }

    const upcomingDonations = await upcomingQuery.getCount();

    // 4. Inventory Units
    const inventory = await this.inventoryRepository.find({
      where: { hospital: { id: userId } }
    });
    
    const totalUnits = inventory.reduce((sum, item) => sum + Number(item.units), 0);

    this.logger.log(`DEBUG STATS RESULT: User=${userId} | Active=${activeRequests} | Urgent=${urgentRequestsNearby} | Upcoming=${upcomingDonations} | TotalUnits=${totalUnits}`);

    // Get specific hospital reservation info
    const profile = await this.hospitalProfileRepository.findOne({ where: { user: { id: userId } } });

    return {
      activeRequests,
      urgentRequestsNearby,
      upcomingDonations,
      totalUnits,
      unitsReceived: profile?.unitsReceived || 0,
      reservedUnits: profile?.reservedUnits || 0,
      termsAccepted: profile?.termsAccepted || false,
    };
  }

  async getRecentActivities(userId: string) {
    return this.activitiesService.findByUser(userId, 10);
  }

  async findPendingApprovals(): Promise<HospitalProfile[]> {
    return this.hospitalProfileRepository.find({
      where: { isApproved: false },
      relations: ['user'],
    });
  }

  async approveHospital(id: string): Promise<HospitalProfile> {
    const profile = await this.findOne(id);
    profile.isApproved = true;
    return this.hospitalProfileRepository.save(profile);
  }

  async rejectHospital(id: string): Promise<HospitalProfile> {
    const profile = await this.findOne(id);
    profile.isApproved = false;
    return this.hospitalProfileRepository.save(profile);
  }

  async acceptTerms(userId: string): Promise<HospitalProfile> {
    const profile = await this.findByUserId(userId);
    profile.termsAccepted = true;
    return this.hospitalProfileRepository.save(profile);
  }
}
