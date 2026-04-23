import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SpecialistProfile } from './entities/specialist-profile.entity';
import { User } from '../users/entities/user.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Appointment } from '../consultations/entities/appointment.entity';
import { ConsultationStatus } from '@repo/shared';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(SpecialistProfile)
    private specialistsRepository: Repository<SpecialistProfile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private activitiesService: ActivitiesService,
  ) {}

  async findAll(): Promise<any[]> {
    const profiles = await this.specialistsRepository.find({ 
      where: { isApproved: true },
      relations: ['user'] 
    });

    return Promise.all(profiles.map(async (profile) => {
        const patientCount = await this.consultationRepository.count({
            where: { specialist: { id: profile.user.id }, status: ConsultationStatus.COMPLETED }
        });
        return { ...profile, patientCount };
    }));
  }

  private deduplicateReviews(reviews: any[]) {
      if (!reviews || !Array.isArray(reviews)) return [];
      
      const map = new Map<string, any>();
      // Sort by date DESC to ensure we keep the most recent if there are duplicates
      const sorted = [...reviews].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      
      for (const r of sorted) {
          if (!map.has(r.patientId)) {
              map.set(r.patientId, r);
          }
      }
      return Array.from(map.values());
  }

  async findOne(id: string): Promise<any> {
    const profile = await this.specialistsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Specialist profile not found');
    }
    
    const patientCount = await this.consultationRepository.count({
        where: { specialist: { id: profile.user.id }, status: ConsultationStatus.COMPLETED }
    });

    profile.reviews = this.deduplicateReviews(profile.reviews);
    
    // Recalculate rating on the fly for accuracy
    const totalRating = profile.reviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
    const avgRating = profile.reviews.length > 0 ? totalRating / profile.reviews.length : 0;

    return { ...profile, patientCount, rating: avgRating };
  }

  async findByUserId(userId: string): Promise<any> {
    const profile = await this.specialistsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Specialist profile not found');
    }

    const patientCount = await this.consultationRepository.count({
        where: { specialist: { id: profile.user.id }, status: ConsultationStatus.COMPLETED }
    });

    profile.reviews = this.deduplicateReviews(profile.reviews);
    
    // Recalculate rating on the fly for accuracy
    const totalRating = profile.reviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
    const avgRating = profile.reviews.length > 0 ? totalRating / profile.reviews.length : 0;

    return { ...profile, patientCount, rating: avgRating };
  }

  async updateProfile(userId: string, data: any): Promise<SpecialistProfile> {
    let profile = await this.specialistsRepository.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!profile) {
      profile = new SpecialistProfile();
      profile.user = { id: userId } as any;
    }

    if (data.phoneNumber) {
      await this.usersRepository.update(userId, { phoneNumber: data.phoneNumber });
    }

    const { 
      specialty, 
      licenseNumber, 
      bio, 
      certificationUrl, 
      bankName, 
      accountNumber, 
      accountName, 
      phoneNumber,
      yearsOfExperience,
      location,
      consultationPackages,
      availabilitySlots
    } = data;
    
    Object.assign(profile, { 
      specialty, 
      licenseNumber, 
      bio, 
      certificationUrl, 
      bankName, 
      accountNumber, 
      accountName, 
      phoneNumber,
      yearsOfExperience,
      location,
      consultationPackages,
      availabilitySlots
    });
    
    const savedProfile = await this.specialistsRepository.save(profile);

    await this.activitiesService.create(
      userId,
      'PROFILE_UPDATE',
      'Profile Updated',
      'You updated your professional specialist profile.'
    );

    return savedProfile;
  }

  async addPackage(userId: string, pkg: any): Promise<SpecialistProfile> {
    const profile = await this.findByUserId(userId);
    if (!profile.consultationPackages) {
      profile.consultationPackages = [];
    }
    profile.consultationPackages.push({ ...pkg, id: Date.now().toString() });
    const savedProfile = await this.specialistsRepository.save(profile);

    await this.activitiesService.create(
      userId,
      'PACKAGE_ADDED',
      `New Package: ${pkg.name}`,
      `You added a new consultation package: ${pkg.name}.`
    );

    return savedProfile;
  }

  async getDashboardStats(userId: string) {
    const upcomingAppointments = await this.consultationRepository.count({
        where: { 
            specialist: { id: userId }, 
            status: In([ConsultationStatus.UPCOMING, ConsultationStatus.CONFIRMED]) 
        },
    });

    const totalConsultations = await this.consultationRepository.count({
      where: { specialist: { id: userId }, status: ConsultationStatus.COMPLETED },
    });

    const earningsResult = await this.consultationRepository.createQueryBuilder('consultation')
      .select('SUM(consultation.specialistPayout)', 'sum')
      .where('consultation.specialistId = :userId', { userId })
      .andWhere('consultation.status = :status', { status: ConsultationStatus.COMPLETED })
      .getRawOne();

    return {
      upcomingAppointments,
      totalConsultations,
      totalEarnings: Number(earningsResult?.sum || 0),
    };
  }

  async getRecentActivities(userId: string) {
    return this.activitiesService.findByUser(userId, 10);
  }

  async findPendingApprovals(): Promise<SpecialistProfile[]> {
    return this.specialistsRepository.find({
      where: { isApproved: false },
      relations: ['user'],
    });
  }

  async approveSpecialist(id: string): Promise<SpecialistProfile> {
    const profile = await this.findOne(id);
    profile.isApproved = true;
    return this.specialistsRepository.save(profile);
  }

  async rejectSpecialist(id: string): Promise<SpecialistProfile> {
    const profile = await this.findOne(id);
    profile.isApproved = false;
    return this.specialistsRepository.save(profile);
  }
}
