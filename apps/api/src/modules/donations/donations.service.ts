import { EmailService } from '../email/email.service';
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { BloodRequest } from './entities/blood-request.entity';
import { DonationMatch } from './entities/donation-match.entity';
import { HospitalFeedback } from './entities/hospital-feedback.entity';
import { DonationStatus, DonationType, UserRole } from '@repo/shared';
import { ActivitiesService } from '../activities/activities.service';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(BloodRequest)
    private bloodRequestsRepository: Repository<BloodRequest>,
    @InjectRepository(DonationMatch)
    private donationMatchesRepository: Repository<DonationMatch>,
    @InjectRepository(HospitalFeedback)
    private feedbackRepository: Repository<HospitalFeedback>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private emailService: EmailService,
    private aiService: AiService,
  ) {}

  async getDonorInsights(donorId: string) {
    const user = await this.usersRepository.findOne({ where: { id: donorId } });
    if (!user) throw new NotFoundException('Donor not found');

    const lastInsightsUpdate = user.donorInsights?.updatedAt;
    // Only refresh insights once a week to save AI calls
    if (lastInsightsUpdate && new Date(lastInsightsUpdate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
        return user.donorInsights;
    }

    const donationHistory = await this.donationMatchesRepository.find({
        where: { donor: { id: donorId }, status: DonationStatus.COMPLETED },
        order: { donatedAt: 'DESC' }
    });

    const activeDonorsCount = await this.usersRepository.count({
        where: { activeRole: UserRole.DONOR, bloodGroup: user.bloodGroup }
    });

    const [burnoutRes, rarityRes] = await Promise.all([
        this.aiService.analyzeDonorBurnout(donationHistory.map(d => ({ date: d.donatedAt, type: d.donationType }))),
        this.aiService.getBloodTypeRarity(user.bloodGroup, activeDonorsCount)
    ]);

    const newInsights = {
        ...user.donorInsights,
        burnoutWarning: burnoutRes?.isBurnoutRisk ? burnoutRes.warningMessage : null,
        rarityMessage: rarityRes?.rarityMessage || `Your ${user.bloodGroup} blood is highly valuable.`,
        updatedAt: new Date().toISOString()
    };

    user.donorInsights = newInsights;
    await this.usersRepository.save(user);

    return newInsights;
  }

  async findAllRequests(): Promise<BloodRequest[]> {
    return this.bloodRequestsRepository.find({ 
      relations: ['hospital', 'hospital.hospitalProfile'],
      order: { createdAt: 'DESC' }
    });
  }

  async findAllMatches(): Promise<DonationMatch[]> {
    return this.donationMatchesRepository.find({
      relations: ['request', 'donor', 'request.hospital', 'request.hospital.hospitalProfile']
    });
  }

  async findRequestById(id: string): Promise<BloodRequest> {
    const request = await this.bloodRequestsRepository.findOne({
      where: { id },
      relations: ['hospital', 'matches', 'matches.donor', 'hospital.hospitalProfile'],
    });
    if (!request) {
      throw new NotFoundException('Blood request not found');
    }
    return request;
  }

  async findMatchById(id: string): Promise<DonationMatch> {
    const match = await this.donationMatchesRepository.findOne({
      where: { id },
      relations: ['request', 'donor', 'request.hospital', 'request.hospital.hospitalProfile']
    });
    if (!match) {
      throw new NotFoundException('Donation match not found');
    }
    return match;
  }

  async findDonationsByDonorId(donorId: string): Promise<DonationMatch[]> {
    return this.donationMatchesRepository.find({
      where: { donor: { id: donorId } },
      relations: ['request', 'request.hospital', 'request.hospital.hospitalProfile'],
      order: { createdAt: 'DESC' }
    });
  }

  async getEligibility(donorId: string) {
    const lastDonation = await this.donationMatchesRepository.findOne({
      where: {
        donor: { id: donorId },
        status: DonationStatus.COMPLETED,
      },
      order: { donatedAt: "DESC" },
    });

    if (!lastDonation) {
      return {
        isEligible: true,
        lastDonationType: null,
        lastDonationDate: null,
        nextEligibleDate: null,
        daysRemaining: 0,
      };
    }

    const type = lastDonation.donationType || DonationType.WHOLE_BLOOD;
    
        let interval = 56;
    if (type === DonationType.WHOLE_BLOOD) {
      const val = this.configService.get('BLOOD_DONATION_INTERVAL_WHOLE_BLOOD');
      interval = val !== undefined ? Number(val) : 56;
    } else if (type === DonationType.PLATELET) {
      const val = this.configService.get('BLOOD_DONATION_INTERVAL_PLATELET');
      interval = val !== undefined ? Number(val) : 7;
    } else if (type === DonationType.DOUBLE_RED_CELL) {
      const val = this.configService.get('BLOOD_DONATION_INTERVAL_DOUBLE_RED_CELL');
      interval = val !== undefined ? Number(val) : 112;
    }
    if (!lastDonation.donatedAt) {
      return {
        isEligible: true,
        lastDonationType: lastDonation.donationType || DonationType.WHOLE_BLOOD,
        lastDonationDate: null,
        nextEligibleDate: null,
        daysRemaining: 0,
      };
    }

    const lastDate = new Date(lastDonation.donatedAt);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + interval);

    const now = new Date();
    const isEligible = now >= nextDate;
    const diffTime = nextDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      isEligible,
      lastDonationType: type,
      lastDonationDate: lastDate.toISOString(),
      nextEligibleDate: nextDate.toISOString(),
      daysRemaining,
    };
  }


async getDonorStats(donorId: string) {
    const completedDonations = await this.donationMatchesRepository.find({
        where: { 
            donor: { id: donorId },
            status: DonationStatus.COMPLETED
        },
        relations: ['request']
    });

    const donationCount = completedDonations.length;
    const unitsDonated = completedDonations.reduce((acc, curr) => acc + (curr.units || 1), 0);
    const livesSaved = unitsDonated * 3;

    const points = donationCount * 100;

    const lastDonation = completedDonations[0];
    const lastDonationDate = lastDonation?.donatedAt ? new Date(lastDonation.donatedAt).toISOString() : null;

    return {
        donationCount,
        unitsDonated,
        livesSaved,
        points,
        lastDonationDate
    };
  }

  async createRequest(hospitalId: string, data: any): Promise<BloodRequest> {
    const hospitalProfile = await this.dataSource.getRepository('hospital_profiles').findOne({
      where: { user: { id: hospitalId } }
    }) as any;

    if (!hospitalProfile?.isApproved) {
      throw new BadRequestException('Hospital is not approved yet to create requests');
    }

    // 1. AI Fraud / Abuse Detection
    // Fetch last 10 requests from this hospital to check for spam
    const recentRequests = await this.bloodRequestsRepository.find({
        where: { hospital: { id: hospitalId } },
        order: { createdAt: 'DESC' },
        take: 10
    });
    
    if (recentRequests.length > 2) {
        const fraudAnalysis = await this.aiService.detectFraud(recentRequests.map(r => ({
            bloodType: r.bloodType,
            units: r.units,
            time: r.createdAt,
            status: r.status
        })));
        
        if (fraudAnalysis?.isFraudulent) {
            // Auto-suspend hospital and throw error
            hospitalProfile.isApproved = false;
            await this.dataSource.getRepository('hospital_profiles').save(hospitalProfile);
            
            // Notify Admin
            await this.activitiesService.create(
                hospitalId, 
                'FRAUD_DETECTED', 
                'Suspicious Activity Flagged', 
                `AI flagged suspicious request patterns: ${fraudAnalysis.reason}. Account temporarily suspended.`
            );
            
            throw new BadRequestException('Account suspended due to suspicious activity: ' + fraudAnalysis.reason);
        }
    }

    // 2. AI Urgency Classification
    let urgency = data.urgency;
    if (data.reason) {
        const urgencyAnalysis = await this.aiService.classifyUrgency(data.reason);
        if (urgencyAnalysis?.urgency) {
            urgency = urgencyAnalysis.urgency; // Override or default
        }
    }

    const request = new BloodRequest();
    request.hospital = { id: hospitalId } as any;
    request.title = data.title;
    request.bloodType = data.bloodType;
    request.units = data.units;
    request.urgency = urgency || 'NORMAL';
    request.reason = data.reason;
    request.donationType = data.donationType || DonationType.WHOLE_BLOOD;
    request.unitsFulfilled = 0;
    
    const savedRequest = await this.bloodRequestsRepository.save(request);

    await this.activitiesService.create(
      hospitalId,
      'BLOOD_REQUEST',
      request.title || `New Blood Request: ${request.bloodType}`,
      `You requested ${request.units} units of ${request.bloodType}. Urgency: ${request.urgency}`,
      { requestId: savedRequest.id }
    );

    // 3. Smart Donor Matching
    try {
        // Fetch eligible donors matching blood type (simplified for example)
        // In a real scenario, we'd also filter by distance and last donation date
        const potentialDonors = await this.usersRepository.find({
            where: { 
                activeRole: UserRole.DONOR,
                bloodGroup: request.bloodType
            }
        });

        if (potentialDonors.length > 0) {
            // Calculate mock distance/response rate for AI context (in real app, calculate actuals)
            const donorsForAi = potentialDonors.map(d => ({
                id: d.id,
                distance: Math.floor(Math.random() * 20) + 'km', // Mock distance
                lastDonationDaysAgo: Math.floor(Math.random() * 100), // Mock days
                responseRate: Math.floor(Math.random() * 100) + '%' // Mock rate
            }));

            let topDonorIds = donorsForAi.map(d => d.id);
            
            if (request.urgency === 'CRITICAL') {
                // If critical, skip AI ranking and notify everyone instantly
                topDonorIds = potentialDonors.map(d => d.id);
            } else {
                // Let AI rank them and return top 5
                topDonorIds = await this.aiService.rankDonors({
                    bloodType: request.bloodType,
                    units: request.units,
                    urgency: request.urgency
                }, donorsForAi);
            }

            // Notify matched donors
            for (const donorId of topDonorIds) {
                await this.notificationsService.sendNotification(
                    donorId,
                    request.urgency === 'CRITICAL' ? 'CRITICAL BLOOD SHORTAGE' : 'Blood Match Found',
                    request.urgency === 'CRITICAL' 
                        ? `URGENT: ${hospitalProfile.hospitalName} needs ${request.units} units of ${request.bloodType} immediately!`
                        : `${hospitalProfile.hospitalName} needs your blood type (${request.bloodType}).`,
                    'donation'
                );
            }
        }
    } catch (e) {
        this.logger.error('Smart Matching failed: ' + e.message);
    }
    
    return savedRequest;
  }

  async updateRequest(hospitalId: string, id: string, data: any): Promise<BloodRequest> {
    const request = await this.bloodRequestsRepository.findOne({
      where: { id },
      relations: ['hospital']
    });

    if (!request) {
      throw new NotFoundException('Blood request not found');
    }

    if (request.hospital.id !== hospitalId) {
      throw new BadRequestException('Unauthorized to update this request');
    }

    // Update fields
    if (data.title) request.title = data.title;
    if (data.bloodType) request.bloodType = data.bloodType;
    if (data.units) request.units = data.units;
    if (data.urgency) request.urgency = data.urgency;
    if (data.reason) request.reason = data.reason;
    if (data.donationType) request.donationType = data.donationType;
    if (data.status) request.status = data.status;

    return this.bloodRequestsRepository.save(request);
  }

  
  async deleteRequestAdmin(id: string): Promise<void> {
    await this.bloodRequestsRepository.delete(id);
  }

  async bulkDeleteRequests(ids: string[]): Promise<void> {
    await this.bloodRequestsRepository.delete({ id: In(ids) });
  }

  async deleteRequest(hospitalId: string, id: string): Promise<void> {
    const request = await this.bloodRequestsRepository.findOne({
      where: { id },
      relations: ['hospital']
    });

    if (!request) {
      throw new NotFoundException('Blood request not found');
    }

    if (request.hospital.id !== hospitalId) {
      throw new BadRequestException('Unauthorized to delete this request');
    }

    await this.bloodRequestsRepository.remove(request);
  }

  async bookDonation(donorId: string, data: { requestId: string, scheduledDate?: Date, isAnonymous?: boolean }): Promise<DonationMatch> {
    const { requestId, scheduledDate, isAnonymous } = data;
    const request = await this.bloodRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['hospital', 'hospital.hospitalProfile']
    });

    if (!request) {
      throw new NotFoundException('Blood request not found');
    }
    
    const donor = await this.usersRepository.findOne({ where: { id: donorId } });

    const eligibility = await this.getEligibility(donorId);
    if (!eligibility.isEligible) {
      throw new BadRequestException(`You are not eligible to donate yet. Next eligible date: ${new Date(eligibility.nextEligibleDate).toLocaleDateString()}`);
    }

    
    const existingMatch = await this.donationMatchesRepository.findOne({
      where: { 
        request: { id: requestId },
        donor: { id: donorId },
        status: DonationStatus.PENDING
      }
    });

    if (existingMatch) {
      throw new BadRequestException('You already have an active booking for this request');
    }

    const match = this.donationMatchesRepository.create({
      request,
      donor: { id: donorId } as any,
      status: DonationStatus.PENDING,
      scheduledDate,
      isAnonymous: !!isAnonymous,
      donationType: request.donationType || DonationType.WHOLE_BLOOD,
    });

    const savedMatch = await this.donationMatchesRepository.save(match);

    // Log for donor
    await this.activitiesService.create(
      donorId,
      'DONATION_BOOKED',
      request.title || `Donation Booked: ${request.bloodType}`,
      `You booked a donation for ${request.bloodType} at ${request.hospital?.hospitalProfile?.hospitalName || 'a hospital'}. Awaiting hospital approval.`,
      { matchId: savedMatch.id }
    );

    // Notify hospital
    const hospitalId = request.hospital.id;
    await this.notificationsService.sendNotification(
      hospitalId,
      'New Donation Booking',
      `${isAnonymous ? 'An anonymous donor' : (donor?.fullName || 'A donor')} has booked to donate ${request.bloodType} blood. Please review and accept.`,
      'donation',
      { matchId: savedMatch.id, requestId: request.id }
    );

    // Send Emails
    try {
      // Email to Hospital
      const hospitalEmail = request.hospital.email;
      if (hospitalEmail) {
        await this.emailService.sendDonationBookingAlert(
          hospitalEmail,
          isAnonymous ? 'An anonymous donor' : (donor?.fullName || 'A donor'),
          request.bloodType,
          scheduledDate
        );
      }

      // Email to Donor
      if (donor?.email) {
        await this.emailService.sendDonationBookingConfirmation(
          donor.email,
          request.hospital?.hospitalProfile?.hospitalName || 'Rubimedik Hospital',
          request.bloodType,
          scheduledDate
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send booking emails: ${error.message}`);
    }

    return savedMatch;
  }

  async cancelDonation(donorId: string, matchId: string): Promise<void> {
    const match = await this.donationMatchesRepository.findOne({
      where: { id: matchId, donor: { id: donorId } },
      relations: ['request', 'request.hospital']
    });

    if (!match) throw new NotFoundException('Donation booking not found');
    
    match.status = DonationStatus.DECLINED;
    match.declineReason = 'Donor cancelled';
    await this.donationMatchesRepository.save(match);

    // Notify hospital
    await this.notificationsService.sendNotification(
      match.request.hospital.id,
      'Donation Cancelled',
      `A donor has cancelled their booking for ${match.request.bloodType}.`,
      'donation'
    );

    // Send Email to Hospital
    try {
      const hospitalEmail = match.request.hospital.email;
      const donor = await this.usersRepository.findOne({ where: { id: donorId } });
      if (hospitalEmail) {
        await this.emailService.sendDonationCancellationAlert(
          hospitalEmail,
          donor?.fullName || donor?.email || 'A donor',
          match.request.bloodType
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send cancellation email: ${error.message}`);
    }
  }

  async rescheduleDonation(donorId: string, matchId: string, newDate: Date): Promise<DonationMatch> {
    const match = await this.donationMatchesRepository.findOne({
      where: { id: matchId, donor: { id: donorId } },
      relations: ['request', 'request.hospital']
    });

    if (!match) throw new NotFoundException('Donation booking not found');

    match.scheduledDate = newDate;
    match.status = DonationStatus.PENDING; 
    const saved = await this.donationMatchesRepository.save(match);

    // Notify hospital
    await this.notificationsService.sendNotification(
      match.request.hospital.id,
      'Donation Rescheduled',
      `A donor has rescheduled their booking for ${match.request.bloodType} to ${newDate.toLocaleString()}.`,
      'donation'
    );

    // Send Email to Hospital
    try {
      const hospitalEmail = match.request.hospital.email;
      const donor = await this.usersRepository.findOne({ where: { id: donorId } });
      if (hospitalEmail) {
        await this.emailService.sendDonationRescheduleAlert(
          hospitalEmail,
          donor?.fullName || donor?.email || 'A donor',
          match.request.bloodType,
          newDate
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send reschedule email: ${error.message}`);
    }

    return saved;
  }

  async updateMatchStatus(hospitalId: string, matchId: string, status: DonationStatus, declineReason?: string): Promise<DonationMatch> {
    const match = await this.donationMatchesRepository.findOne({
      where: { id: matchId },
      relations: ['request', 'request.hospital', 'donor']
    });

    if (!match) throw new NotFoundException('Donation booking not found');
    if (match.request.hospital.id !== hospitalId) throw new BadRequestException('Unauthorized');

    match.status = status;
    if (status === DonationStatus.DECLINED && declineReason) {
      match.declineReason = declineReason;
    }
    const savedMatch = await this.donationMatchesRepository.save(match);

    // Notify Donor
    const donorId = match.donor.id;
    const title = status === DonationStatus.ACCEPTED ? 'Donation Accepted' : 'Donation Declined';
    const msg = status === DonationStatus.ACCEPTED 
      ? `Your donation booking for ${match.request.bloodType} at ${match.request.hospital?.hospitalProfile?.hospitalName} has been accepted.`
      : `Your donation booking for ${match.request.bloodType} was declined by the hospital.${declineReason ? " Reason: " + declineReason : ""}`;

    await this.notificationsService.sendNotification(donorId, title, msg, 'donation', { matchId: savedMatch.id });

    // Send Email to Donor
    try {
      if (match.donor?.email) {
        await this.emailService.sendDonationStatusUpdate(
          match.donor.email,
          match.request.hospital?.hospitalProfile?.hospitalName || 'Rubimedik Hospital',
          match.request.bloodType,
          status,
          declineReason
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send status update email: ${error.message}`);
    }
    
    // Log Activity
    await this.activitiesService.create(
      hospitalId,
      status === DonationStatus.ACCEPTED ? 'DONATION_ACCEPTED' : 'DONATION_DECLINED',
      title,
      `You ${status.toLowerCase()} a donation from ${match.donor.fullName || match.donor.email}.`
    );

    return savedMatch;
  }

  async completeDonation(hospitalId: string, matchId: string, unitsDonated?: number): Promise<DonationMatch> {
    const match = await this.donationMatchesRepository.findOne({
      where: { id: matchId },
      relations: ['request', 'request.hospital', 'donor'],
    });

    if (!match) throw new NotFoundException('Donation match not found');
    if (match.request.hospital.id !== hospitalId) throw new BadRequestException('Unauthorized');

    match.status = DonationStatus.COMPLETED;
    match.donatedAt = new Date();

    const savedMatch = await this.donationMatchesRepository.save(match);

    // Update Blood Request fulfillment
    if (match.request) {
        const request = match.request;
        const donated = unitsDonated || 1;
        request.unitsFulfilled = Number(request.unitsFulfilled || 0) + Number(donated);
        
        if (request.unitsFulfilled >= request.units) {
            request.status = DonationStatus.COMPLETED;
        }
        await this.bloodRequestsRepository.save(request);
    }

    // Log for hospital
    await this.activitiesService.create(
      hospitalId,
      'DONATION_COMPLETED',
      match.request.title || `Donation Completed: ${match.request.bloodType}`,
      `Donation from ${match.isAnonymous ? 'Anonymous' : (match.donor.fullName || match.donor.email)} for ${match.request.bloodType} has been recorded.`,
      { matchId: savedMatch.id }
    );

    // Notify Donor
    await this.notificationsService.sendNotification(
      match.donor.id,
      'Donation Completed',
      `Thank you! Your donation for ${match.request.bloodType} at ${match.request.hospital?.hospitalProfile?.hospitalName} has been recorded.`,
      'donation'
    );

    // Send Email to Donor
    try {
      if (match.donor?.email) {
        await this.emailService.sendDonationCompletionEmail(
          match.donor.email,
          match.request.hospital?.hospitalProfile?.hospitalName || 'Rubimedik Hospital',
          match.request.bloodType,
          unitsDonated || match.units || 1
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send completion email: ${error.message}`);
    }

    return savedMatch;
  }

  async recordDonation(hospitalId: string, data: any): Promise<DonationMatch> {
    const { donorEmail, bloodType, units, donationDate, requestId, donationType, matchId } = data;

    const donor = await this.usersRepository.findOne({ where: { email: donorEmail } });
    if (!donor) throw new NotFoundException('Donor not found with this email');

    let request: BloodRequest;
    
    if (requestId) {
        request = await this.bloodRequestsRepository.findOne({ where: { id: requestId }, relations: ['hospital', 'hospital.hospitalProfile'] });
        if (!request) throw new NotFoundException('Request not found');
        
        request.unitsFulfilled = Number(request.unitsFulfilled || 0) + Number(units);
        if (request.unitsFulfilled >= request.units) {
            request.status = DonationStatus.COMPLETED;
        }
        await this.bloodRequestsRepository.save(request);
    } else {
        request = new BloodRequest();
        request.hospital = { id: hospitalId } as any;
        request.title = data.title || data.reason?.substring(0, 30);
        request.bloodType = bloodType;
        request.units = units;
        request.unitsFulfilled = units;
        request.status = DonationStatus.COMPLETED;
        request.urgency = data.urgency || "NORMAL" as any;
        request.donationType = donationType || DonationType.WHOLE_BLOOD;
        await this.bloodRequestsRepository.save(request);
    }

    // Try to find an existing match to update
    let match: DonationMatch;
    
    if (matchId) {
      match = await this.donationMatchesRepository.findOne({ where: { id: matchId } });
    } else if (requestId) {
      match = await this.donationMatchesRepository.findOne({
        where: { 
          request: { id: requestId }, 
          donor: { id: donor.id },
          status: In([DonationStatus.PENDING, DonationStatus.ACCEPTED])
        }
      });
    }

    if (match) {
      match.status = DonationStatus.COMPLETED;
      match.donatedAt = new Date(donationDate);
      match.units = units;
      match.donationType = donationType || match.donationType || request.donationType || DonationType.WHOLE_BLOOD;
    } else {
      match = this.donationMatchesRepository.create({
        request,
        donor: donor,
        status: DonationStatus.COMPLETED,
        donatedAt: new Date(donationDate),
        units: units,
        donationType: donationType || request.donationType || DonationType.WHOLE_BLOOD,
      });
    }

    const savedMatch = await this.donationMatchesRepository.save(match);

    await this.activitiesService.create(
      hospitalId,
      'DONATION_RECORDED',
      request.title || `Donation Recorded: ${bloodType}`,
      `You recorded a donation of ${units} units from ${donorEmail}.`,
      { matchId: savedMatch.id, donorEmail }
    );

    // Notify Donor
    try {
      await this.notificationsService.sendNotification(
        donor.id,
        'Donation Recorded',
        `Thank you! Your donation for ${bloodType} at ${request.hospital?.hospitalProfile?.hospitalName || 'our facility'} has been recorded.`,
        'donation',
        { matchId: savedMatch.id }
      );

      if (donor.email) {
        await this.emailService.sendDonationCompletionEmail(
          donor.email,
          request.hospital?.hospitalProfile?.hospitalName || 'Rubimedik Hospital',
          bloodType,
          units
        );
      }
    } catch (error) {
      this.logger.error(`Failed to notify donor after recording: ${error.message}`);
    }

    return savedMatch;
  }

  async findMatchesByHospital(hospitalId: string): Promise<DonationMatch[]> {
    return this.donationMatchesRepository.find({
      where: { request: { hospital: { id: hospitalId } } },
      relations: ['request', 'donor'],
      order: { createdAt: 'DESC' }
    });
  }

  // Feedback Logic
  async submitFeedback(donorId: string, data: { hospitalId: string, requestId?: string, rating: number, comment: string, isAnonymous?: boolean }) {
    const feedback = this.feedbackRepository.create({
        donor: { id: donorId } as any,
        hospital: { id: data.hospitalId } as any,
        request: data.requestId ? { id: data.requestId } as any : null,
        rating: data.rating,
        comment: data.comment,
        isAnonymous: !!data.isAnonymous
    });
    return this.feedbackRepository.save(feedback);
  }

  async getFeedbacks(hospitalId: string) {
      return this.feedbackRepository.find({
          where: { hospital: { id: hospitalId } },
          relations: ['donor'],
          order: { createdAt: 'DESC' }
      });
  }

  async checkIn(matchId: string, userId: string) {
    const match = await this.donationMatchesRepository.findOne({
        where: { id: matchId },
        relations: ['donor', 'request', 'request.hospital']
    });

    if (!match) throw new NotFoundException('Donation match not found');

    if (match.donor.id === userId) {
        match.isDonorCheckedIn = true;
    } else if (match.request.hospital.id === userId) {
        match.isHospitalCheckedIn = true;
    } else {
        throw new BadRequestException('User not part of this donation');
    }

    await this.donationMatchesRepository.save(match);

    return `
        <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #D32F2F;">✓ Verified Successfully</h1>
                <p>Thank you for verifying your availability for the donation.</p>
                <p>Please return to the Rubimedik app.</p>
            </body>
        </html>
    `;
  }
}
