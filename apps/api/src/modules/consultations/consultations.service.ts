import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { Appointment } from './entities/appointment.entity';
import { ChatRoom } from '../chat/entities/chat-room.entity';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConsultationStatus, TransactionType, TransactionStatus, PayoutStatus } from '@repo/shared';
import { Transaction } from '../wallet/entities/transaction.entity';
import { SpecialistProfile } from '../specialists/entities/specialist-profile.entity';
import { ActivitiesService } from '../activities/activities.service';
import { AiService } from '../ai/ai.service';
import { TrustScoreService } from '../users/trust-score.service';
import { Message } from '../chat/entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);
  constructor(
    @InjectRepository(Consultation)
    private consultationsRepository: Repository<Consultation>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(ChatRoom)
    private chatRoomsRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private activitiesService: ActivitiesService,
    private walletService: WalletService,
    private dataSource: DataSource,
    private configService: ConfigService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private aiService: AiService,
    private trustScoreService: TrustScoreService,
  ) {}

  async findAll(): Promise<Consultation[]> {
    return this.consultationsRepository.find({
      relations: ['specialist', 'patient', 'appointments'],
    });
  }

  async getAgoraToken(consultationId: string, userId: string) {
    const consultation = await this.consultationsRepository.findOne({
      where: { id: consultationId },
      relations: ['patient', 'specialist'],
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    // 1. Verify user is part of this consultation
    if (consultation.patient.id !== userId && consultation.specialist.id !== userId) {
      throw new BadRequestException('You are not authorized to join this consultation');
    }

    // 2. Verify consultation status
    const allowedStatuses = [ConsultationStatus.CONFIRMED, ConsultationStatus.UPCOMING, ConsultationStatus.IN_PROGRESS];
    if (!allowedStatuses.includes(consultation.status as any)) {
      throw new BadRequestException(`Cannot join call. Consultation is ${consultation.status.toLowerCase()}`);
    }

    // 3. Calculate remaining time
    const now = new Date();
    const scheduledStartTime = new Date(consultation.scheduledAt);
    const durationMinutes = consultation.duration || 30;
    const gracePeriodMinutes = 5; 
    
    const sessionEndTime = new Date(scheduledStartTime.getTime() + (durationMinutes + gracePeriodMinutes) * 60 * 1000);
    const bufferStartTime = new Date(scheduledStartTime.getTime() - 10 * 60 * 1000); // 10 mins before

    if (now < bufferStartTime) {
        throw new BadRequestException('It is too early to join this consultation.');
    }
    if (now > sessionEndTime) {
        throw new BadRequestException('This consultation session has expired.');
    }

    const remainingSeconds = Math.floor((sessionEndTime.getTime() - now.getTime()) / 1000);

    const appId = this.configService.get<string>('AGORA_APP_ID');
    const appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE');
    const channelName = consultationId;
    const uid = 0; // 0 allows Agora to assign a random uid
    const role = RtcRole.PUBLISHER;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + remainingSeconds; // Set token expiry to match session end

    if (!appId || !appCertificate) {
      this.logger.error('Agora App ID or Certificate is missing from environment');
      throw new InternalServerErrorException('Video service configuration error');
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    return {
      token,
      channelName,
      appId,
      remainingSeconds,
    };
  }

  
  async findMyAppointments(userId: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: [
        { consultation: { patient: { id: userId } } },
        { consultation: { specialist: { id: userId } } },
      ],
      relations: [
        'consultation', 
        'consultation.specialist', 
        'consultation.specialist.specialistProfile',
        'consultation.patient',
        'consultation.patient.specialistProfile'
      ],
      order: { scheduledAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findOne({
      where: { id },
      relations: ['specialist', 'specialist.specialistProfile', 'patient', 'appointments', 'supportTickets', 'supportTickets.chatRoom'],
    });
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }
    return consultation;
  }

  async findByPatientId(patientId: string): Promise<Consultation[]> {
    return this.consultationsRepository.find({
      where: { patient: { id: patientId } },
      relations: ['specialist', 'appointments', 'supportTickets', 'supportTickets.chatRoom'],
    });
  }

  async findBySpecialistId(specialistId: string): Promise<Consultation[]> {
    return this.consultationsRepository.find({
      where: { specialist: { id: specialistId } },
      relations: ['patient', 'appointments', 'supportTickets', 'supportTickets.chatRoom'],
    });
  }

  async bookConsultation(patientId: string, specialistId: string, totalFee: number, usePoints: boolean = false, symptoms?: string, scheduledAt?: string, attachments?: string[]) {
    const specialistProfile = await this.dataSource.getRepository('specialist_profiles').findOne({
      where: { id: specialistId },
      relations: ['user']
    }) as any;

    if (!specialistProfile?.isApproved) {
      throw new BadRequestException('Specialist is not approved yet for consultations');
    }

    const wallet = await this.walletService.getBalance(patientId);

    // Find selected package to get type
    const pkg = specialistProfile.consultationPackages?.find((p: any) => p.price == totalFee);
    const consultationType = pkg?.type || 'video';

    const pointValue = this.configService.get<number>('REFERRAL_POINT_VALUE') || 500;
    
    let pointsToDeduct = 0;
    let amountFromPoints = 0;
    let amountFromWallet = totalFee;

    if (usePoints && wallet.points > 0) {
      const maxPointsValue = wallet.points * pointValue;
      amountFromPoints = Math.min(maxPointsValue, totalFee);
      pointsToDeduct = Math.floor(amountFromPoints / pointValue);
      amountFromPoints = pointsToDeduct * pointValue;
      amountFromWallet = totalFee - amountFromPoints;
    }

    if (wallet.balance < amountFromWallet) {
      throw new BadRequestException({
        message: 'Insufficient funds',
        shortfall: amountFromWallet - wallet.balance,
        walletBalance: wallet.balance,
        pointsValue: amountFromPoints
      });
    }

    // Availability Validation
    const duration = Number(pkg?.duration) || 30;

    if (scheduledAt) {
        const date = new Date(scheduledAt);
        const now = new Date();

        if (date < now) {
            throw new BadRequestException('Cannot book a consultation in the past');
        }

        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayName = days[date.getDay()];
        
        const availability = specialistProfile.availabilitySlots?.[dayName];
        if (!availability || !availability.active) {
          throw new BadRequestException(`Specialist is not available on ${dayName.toUpperCase()}s`);
        }

        // Check start time
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        if (timeStr < availability.start) {
          throw new BadRequestException(`Selected time ${timeStr} is before specialist's available hours (${availability.start})`);
        }

        // Check end time
        const endDate = new Date(date.getTime() + duration * 60000);
        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        const endTimeStr = `${endHours}:${endMinutes}`;

        if (endTimeStr > availability.end) {
            throw new BadRequestException(`Consultation ends at ${endTimeStr}, which is outside specialist's available hours (ends at ${availability.end})`);
        }

        // Check for overlapping bookings for this specialist
        const overlap = await this.appointmentsRepository.createQueryBuilder('appointment')
          .innerJoin('appointment.consultation', 'consultation')
          .innerJoin('consultation.specialist', 'specialist')
          .where('specialist.id = :specialistUserId', { specialistUserId: specialistProfile.user.id })
          .andWhere('appointment.status IN (:...statuses)', { statuses: [ConsultationStatus.UPCOMING, ConsultationStatus.CONFIRMED] })
          .andWhere('appointment.scheduledAt < :endDate', { endDate })
          .andWhere("appointment.scheduledAt + (appointment.duration * interval '1 minute') > :startDate", { startDate: date })
          .getOne();

        if (overlap) {
          throw new BadRequestException('This time slot overlaps with another scheduled consultation');
        }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (pointsToDeduct > 0) {
        wallet.points = wallet.points - pointsToDeduct;
        await this.walletService.createTransaction(
          patientId,
          amountFromPoints,
          TransactionType.DEBIT,
          `POINTS-CONS-${Date.now()}`,
          TransactionStatus.COMPLETED,
          { note: 'Consultation Payment via Points' }
        );
      }

      if (amountFromWallet > 0) {
        wallet.balance = Number(wallet.balance) - Number(amountFromWallet);
        await this.walletService.createTransaction(
          patientId,
          amountFromWallet,
          TransactionType.DEBIT,
          `WALLET-CONS-${Date.now()}`,
          TransactionStatus.COMPLETED,
          { note: 'Consultation Payment via Wallet' }
        );
      }

      await queryRunner.manager.save(wallet);

      const consultation = new Consultation();
      consultation.patient = { id: patientId } as any;
      consultation.specialist = { id: specialistProfile.user.id } as any; // Map to correct User ID
      consultation.platformFee = totalFee * 0.2;
      consultation.specialistPayout = totalFee * 0.8;
      consultation.status = ConsultationStatus.UPCOMING;
      consultation.symptoms = symptoms;
      consultation.attachments = attachments;
      consultation.consultationType = consultationType;
      consultation.duration = duration;

      consultation.scheduledAt = new Date(scheduledAt);

      const savedConsultation = await queryRunner.manager.save(consultation);

      // Auto-generate Jitsi Meeting Link using the generated ID
      savedConsultation.meetingLink = `https://meet.jit.si/rubimedik-${savedConsultation.id}`;
      await queryRunner.manager.save(savedConsultation);

      // Find existing chat room between this patient and specialist to persist chat history
      let chatRoom = await queryRunner.manager.findOne(ChatRoom, {
          where: {
              patient: { id: patientId },
              specialist: { id: specialistProfile.user.id }
          }
      });

      if (!chatRoom) {
          chatRoom = new ChatRoom();
          chatRoom.patient = { id: patientId } as any;
          chatRoom.specialist = { id: specialistProfile.user.id } as any;
      }

      chatRoom.consultation = savedConsultation;
      await queryRunner.manager.save(chatRoom);

      // Create initial appointment
      if (scheduledAt) {
          const appointment = new Appointment();
          appointment.consultation = savedConsultation;
          appointment.scheduledAt = new Date(scheduledAt);
          appointment.duration = duration;
          appointment.status = ConsultationStatus.UPCOMING;
          await queryRunner.manager.save(appointment);
      }

      await queryRunner.commitTransaction();

      // Activity Logs
      await this.activitiesService.create(patientId, 'CONSULTATION_BOOKED', 'Consultation Booked', `You booked a consultation with ${specialistProfile.user.fullName}`);
      await this.activitiesService.create(specialistProfile.user.id, 'CONSULTATION_BOOKED', 'New Consultation', `A new consultation has been booked by ${wallet.user.fullName}`);

      // 1. Notify Specialist
      const specialistEmail = specialistProfile.user.email;
      const specialistName = specialistProfile.user.fullName || 'Specialist';
      const patientName = wallet.user.fullName || wallet.user.email.split('@')[0];
      const apptDate = new Date(scheduledAt || Date.now());

      await this.emailService.sendSpecialistBookingAlert(
          specialistEmail, 
          patientName,
          apptDate,
          specialistName
      );

      // 2. Notify Patient
      await this.emailService.sendBookingConfirmation(
          wallet.user.email,
          specialistName,
          apptDate,
          patientName
      );

      await this.notificationsService.sendNotification(
        specialistProfile.user.id,
        'New Booking Received',
        `A patient has booked a consultation with you. Fees held in escrow.`,
        'appointment'
      );

      return savedConsultation;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async confirmConsultation(id: string, specialistId: string) {
    const consultation = await this.findOne(id);
    if (consultation.specialist.id !== specialistId) {
      throw new BadRequestException('Unauthorized to confirm this consultation');
    }

    if (consultation.status !== ConsultationStatus.UPCOMING) {
      throw new BadRequestException('Only upcoming requests can be confirmed');
    }

    consultation.status = ConsultationStatus.CONFIRMED;
    await this.consultationsRepository.save(consultation);

    // Update related appointments
    await this.appointmentsRepository.update(
      { consultation: { id } }, 
      { status: ConsultationStatus.CONFIRMED }
    );

    // Notify patient
    await this.notificationsService.sendNotification(
      consultation.patient.id,
      'Appointment Confirmed',
      `Your appointment with Dr. ${consultation.specialist.fullName || 'the specialist'} has been confirmed.`,
      'appointment'
    );

    // Activity Logs
    await this.activitiesService.create(consultation.specialist.id, 'APPOINTMENT_CONFIRMED', 'Appointment Confirmed', `You confirmed the appointment with ${consultation.patient.fullName}`);
    await this.activitiesService.create(consultation.patient.id, 'APPOINTMENT_CONFIRMED', 'Appointment Confirmed', `Your appointment with Dr. ${consultation.specialist.fullName} has been confirmed.`);

    return consultation;
  }

  async declineConsultation(id: string, specialistId: string) {
    const consultation = await this.findOne(id);
    if (consultation.specialist.id !== specialistId) {
        throw new BadRequestException('Unauthorized to decline this consultation');
    }

    if (consultation.status !== ConsultationStatus.UPCOMING) {
        throw new BadRequestException('Can only decline upcoming requests');
    }

    consultation.status = ConsultationStatus.DECLINED;
    return this.processRefund(consultation, 1, true); // Full refund if declined by specialist
  }

  async rescheduleConsultation(id: string, userId: string, newDate: string) {
    const consultation = await this.findOne(id);
    if (consultation.specialist.id !== userId && consultation.patient.id !== userId) {
      throw new BadRequestException('Unauthorized to reschedule this consultation');
    }

    const scheduledDate = new Date(newDate);
    const now = new Date();

    if (scheduledDate < now) {
        throw new BadRequestException('Cannot reschedule to a past time');
    }

    const duration = consultation.duration || 30;

    // Fetch specialist profile for availability check
    const specialistProfile = await this.dataSource.getRepository('specialist_profiles').findOne({
      where: { user: { id: consultation.specialist.id } }
    }) as any;

    if (specialistProfile) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayName = days[scheduledDate.getDay()];
        const availability = specialistProfile.availabilitySlots?.[dayName];

        if (!availability || !availability.active) {
            throw new BadRequestException(`Specialist is not available on ${dayName.toUpperCase()}s`);
        }

        const hours = scheduledDate.getHours().toString().padStart(2, '0');
        const minutes = scheduledDate.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        if (timeStr < availability.start) {
            throw new BadRequestException(`Selected time ${timeStr} is before specialist's available hours (${availability.start})`);
        }

        const endDate = new Date(scheduledDate.getTime() + duration * 60000);
        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        const endTimeStr = `${endHours}:${endMinutes}`;

        if (endTimeStr > availability.end) {
            throw new BadRequestException(`Consultation ends at ${endTimeStr}, which is outside specialist's available hours (ends at ${availability.end})`);
        }

        // Overlap Check (Excluding current consultation)
        const overlap = await this.appointmentsRepository.createQueryBuilder('appointment')
            .innerJoin('appointment.consultation', 'consultation')
            .innerJoin('consultation.specialist', 'specialist')
            .where('specialist.id = :specialistUserId', { specialistUserId: consultation.specialist.id })
            .andWhere('consultation.id != :currentId', { currentId: id })
            .andWhere('appointment.status IN (:...statuses)', { statuses: [ConsultationStatus.UPCOMING, ConsultationStatus.CONFIRMED] })
            .andWhere('appointment.scheduledAt < :endDate', { endDate })
            .andWhere("appointment.scheduledAt + (appointment.duration * interval '1 minute') > :startDate", { startDate: scheduledDate })
            .getOne();

        if (overlap) {
            throw new BadRequestException('This time slot overlaps with another scheduled consultation');
        }
    }
    
    // Update appointments
    await this.appointmentsRepository.update(
      { consultation: { id } },
      { scheduledAt: scheduledDate }
    );

    // Sync Consultation entity's scheduledAt
    await this.consultationsRepository.update(id, { scheduledAt: scheduledDate });

    // Notify other party
    const isSpecialist = consultation.specialist.id === userId;
    const otherPartyId = isSpecialist ? consultation.patient.id : consultation.specialist.id;
    const initiatorName = isSpecialist ? `Dr. ${consultation.specialist.fullName || 'the specialist'}` : consultation.patient.fullName || 'The patient';

    const dateStr = scheduledDate.toLocaleString();
    await this.notificationsService.sendNotification(
      otherPartyId,
      'Appointment Rescheduled',
      `${initiatorName} has moved your appointment to ${dateStr}.`,
      'appointment'
    );

    // Activity Logs
    await this.activitiesService.create(userId, 'APPOINTMENT_RESCHEDULED', 'Appointment Rescheduled', `You moved the appointment to ${dateStr}`);
    await this.activitiesService.create(otherPartyId, 'APPOINTMENT_RESCHEDULED', 'Appointment Rescheduled', `${initiatorName} moved the appointment to ${dateStr}`);

    return { success: true, newDate: scheduledDate };
  }

  async completeConsultation(consultationId: string) {
    const consultation = await this.findOne(consultationId);

    if (consultation.status === ConsultationStatus.COMPLETED || consultation.status === ConsultationStatus.PENDING_PAYOUT) {
      throw new BadRequestException('Consultation already completed or pending payout');
    }

    consultation.status = ConsultationStatus.PENDING_PAYOUT;
    const followUpWindow = Number(this.configService.get('FOLLOWUP_WINDOW_DAYS') || 30);
    consultation.followUpWindowDays = followUpWindow;
    consultation.followUpCount = 1; 

    const now = new Date();
    consultation.completedAt = now;
    
    // Get grace period from env - support both hours and minutes
    const envHours = this.configService.get('CONSULTATION_GRACE_PERIOD_HOURS');
    const envMinutes = this.configService.get('CONSULTATION_GRACE_PERIOD_MINUTES');
    
    let totalGraceMs = 0;
    if (envMinutes !== undefined) {
        totalGraceMs = Number(envMinutes) * 60 * 1000;
    } else {
        totalGraceMs = Number(envHours || 48) * 60 * 60 * 1000;
    }
    
    // Chat stays open until payout is PAID. 
    // chatClosesAt will now be used by the scheduler to ARCHIVE the consultation only AFTER it is PAID.
    consultation.payoutReleasesAt = new Date(now.getTime() + totalGraceMs);
    consultation.chatClosesAt = null; // We'll set this during payout execution instead

    this.logger.log(`Consultation ${consultationId} completed. Payout scheduled for: ${consultation.payoutReleasesAt.toISOString()}`);
    
    // Ghost Consultation Detection
    const messages = await this.messagesRepository.count({
        where: { chatRoom: { consultation: { id: consultationId } } }
    });
    
    const ghostCheck = await this.aiService.detectGhostConsultation({
        durationMinutes: (now.getTime() - new Date(consultation.scheduledAt || consultation.createdAt).getTime()) / 60000,
        messagesCount: messages,
        hasPatientFeedback: !!consultation.patientFeedback,
        isEarlyCompletion: true // Flag that we are checking immediately after specialist clicked complete
    });

    if (ghostCheck?.isGhost) {
        consultation.payoutStatus = PayoutStatus.HELD;
        consultation.payoutNote = 'AI Ghost Detection Flag: ' + ghostCheck.reason;
        
        // Penalize Trust Score
        this.trustScoreService.updateSpecialistScore(consultation.specialist.id, 'GHOST_FLAG');
        
        // Notify Admin & Patient
        this.activitiesService.create(consultation.specialist.id, 'FRAUD_DETECTED', 'Ghost Consultation Flagged', `Consultation ${consultationId} flagged by AI.`);
        this.notificationsService.sendNotification(consultation.patient.id, 'Verify Consultation', 'Did your consultation take place? Please submit feedback.', 'feedback');
    } else {
        this.trustScoreService.updatePatientScore(consultation.patient.id, 'COMPLETED_CONSULTATION');
        this.trustScoreService.updateSpecialistScore(consultation.specialist.id, 'COMPLETED_CONSULTATION');
    }

    await this.consultationsRepository.save(consultation);

    // Trigger AI Clinical Summary (Background)
    this.generateAiSummary(consultationId).catch(e => this.logger.error('AI Summary failed: ' + e.message));

    // Activity Logs
    await this.activitiesService.create(consultation.patient.id, 'CONSULTATION_COMPLETED', 'Meeting Completed', `Your meeting with ${consultation.specialist.fullName} has ended. Please leave a review.`);
    await this.activitiesService.create(consultation.specialist.id, 'CONSULTATION_COMPLETED', 'Meeting Completed', `Your meeting with ${consultation.patient.fullName} has ended.`);

    // Notify patient to leave review
    await this.notificationsService.sendNotification(
      consultation.patient.id,
      'Meeting Completed',
      'Your meeting is over. Please leave a review to release payment to the specialist.',
      'feedback'
    );

    // Send Email to patient
    await this.emailService.sendFeedbackRequest(
        consultation.patient.email,
        consultation.specialist.fullName,
        consultation.id,
        consultation.patient.fullName || consultation.patient.email.split('@')[0]
    );

    return consultation;
  }

  async submitFeedback(consultationId: string, userId: string, feedback: any) {
    const consultation = await this.findOne(consultationId);
    const isPatient = consultation.patient.id === userId;
    const isSpecialist = consultation.specialist.id === userId;

    if (!isPatient && !isSpecialist) {
        throw new BadRequestException('Unauthorized to leave feedback');
    }

    if (isPatient) {
        consultation.patientFeedback = feedback;
        
        // If it was held due to "No Patient Feedback" or "Waiting for feedback", we can re-evaluate
        const note = consultation.payoutNote?.toLowerCase() || '';
        if (consultation.payoutStatus === PayoutStatus.HELD && (note.includes('feedback') || note.includes('review'))) {
            this.logger.log(`Consultation ${consultationId} feedback received. Clearing hold flag.`);
            consultation.payoutStatus = PayoutStatus.PENDING;
            consultation.payoutNote = 'Feedback received. Payout hold cleared.';
        }

        // Update specialist rating if rating exists in feedback
        if (feedback.rating) {
            await this.addReview(consultationId, userId, feedback);
        }

        // Tiered Notification for Specialist
        const rating = Number(feedback.rating || 5);
        const isFlagged = feedback.didSpecialistShow === 'No' || feedback.offPlatformContact === 'Yes';
        
        let notifyMessage = '';
        if (isFlagged) {
            notifyMessage = 'A concern was raised about a recent consultation. Our team will review it shortly.';
        } else if (rating >= 4) {
            notifyMessage = `⭐ A patient rated your consultation ${rating} stars. Tap to view your updated rating.`;
        } else if (rating === 3) {
            notifyMessage = 'A patient submitted feedback for your recent consultation. Tap to view.';
        } else {
            notifyMessage = 'A patient left feedback that needs your attention. Tap to review.';
        }

        await this.notificationsService.sendNotification(
            consultation.specialist.id,
            'Consultation Feedback',
            notifyMessage,
            'feedback'
        );

        await this.emailService.sendSpecialistFeedbackNotification(
            consultation.specialist.email,
            notifyMessage
        );
    } else {
        consultation.specialistFeedback = feedback;
        // Record specialist-provided documents
        if (feedback.prescriptionUrl) consultation.prescriptionUrl = feedback.prescriptionUrl;
        if (feedback.labRequestUrl) consultation.labRequestUrl = feedback.labRequestUrl;
        if (feedback.labReportUrl) consultation.labReportUrl = feedback.labReportUrl;
        if (feedback.medicalReportUrl) consultation.medicalReportUrl = feedback.medicalReportUrl;
    }

    // Check if both have submitted feedback (trigger immediate payout logic)
    if (consultation.patientFeedback && consultation.specialistFeedback) {
        this.logger.log(`Feedback complete for consultation ${consultationId}. Triggering immediate payout processing.`);
        await this.processPayoutLogic(consultation);
    } else {
        await this.consultationsRepository.save(consultation);
    }

    return { status: 'success', message: 'Feedback submitted' };
  }

  async executePayoutLogicForScheduler(consultationId: string) {
    const consultation = await this.findOne(consultationId);
    
    if (consultation.payoutStatus === PayoutStatus.PAID) return;
    
    return this.processPayoutLogic(consultation);
  }

  private async processPayoutLogic(consultation: Consultation) {
    const p = consultation.patientFeedback;
    const s = consultation.specialistFeedback;

    let payoutStatus = PayoutStatus.AUTO_APPROVED;
    let payoutNote = 'System verified completion.';

    // HOLD logic
    if (s.outcome === 'Patient no-show' && p.didSpecialistShow === 'Yes') {
        payoutStatus = PayoutStatus.PENDING_REVIEW;
        payoutNote = 'Discrepancy: Specialist claimed patient no-show, but patient claimed specialist showed.';
    } else if (p.didSpecialistShow === 'No') {
        payoutStatus = PayoutStatus.HELD;
        payoutNote = 'Patient reported specialist no-show.';
    }

    // FLAG logic
    if (p.offPlatformContact === 'Yes' || s.flag === 'Patient was abusive/inappropriate') {
        payoutStatus = PayoutStatus.PENDING_REVIEW;
        payoutNote = 'Flagged for professional conduct or off-platform solicitation.';
    }

    if (p.rating < 3 && payoutStatus === PayoutStatus.AUTO_APPROVED) {
        payoutStatus = PayoutStatus.PENDING_REVIEW;
        payoutNote = 'Low patient rating requires manual review.';
    }

    consultation.payoutStatus = payoutStatus;
    consultation.payoutNote = payoutNote;
    consultation.status = ConsultationStatus.COMPLETED;
    
    if (payoutStatus === PayoutStatus.AUTO_APPROVED) {
        // TRIGGER ACTUAL PAYOUT
        await this.executePayout(consultation);
    } else {
        await this.consultationsRepository.save(consultation);
        // Notify admin of flagged payout
        await this.notificationsService.sendNotification('ADMIN', 'Payout Flagged', `Consultation ${consultation.id} requires review.`, 'admin_payout');
    }
  }

  private async executePayout(consultation: Consultation) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Cleanup orphaned transactions if they exist from a previous failed run
        const existingPayout = await queryRunner.manager.findOne(Transaction, { where: { reference: `PAYOUT-${consultation.id}` } });
        if (existingPayout) await queryRunner.manager.delete(Transaction, { reference: `PAYOUT-${consultation.id}` });
        
        const existingFee = await queryRunner.manager.findOne(Transaction, { where: { reference: `FEE-${consultation.id}` } });
        if (existingFee) await queryRunner.manager.delete(Transaction, { reference: `FEE-${consultation.id}` });

        consultation.payoutStatus = PayoutStatus.PAID;
        consultation.status = ConsultationStatus.COMPLETED;
        // Close chat 1 hour after payout is released to allow final "thank you" messages
        consultation.chatClosesAt = new Date(Date.now() + (60 * 60 * 1000)); 
        await queryRunner.manager.save(consultation);

        const specialistWallet = await this.walletService.getBalance(consultation.specialist.id);
        specialistWallet.balance = Number(specialistWallet.balance) + Number(consultation.specialistPayout);
        await queryRunner.manager.save(specialistWallet);

        const payoutTx = new Transaction();
        payoutTx.wallet = specialistWallet;
        payoutTx.amount = consultation.specialistPayout;
        payoutTx.type = TransactionType.CREDIT;
        payoutTx.reference = `PAYOUT-${consultation.id}`;
        payoutTx.status = TransactionStatus.COMPLETED;
        payoutTx.metadata = { consultationId: consultation.id, note: 'Consultation Payout' };
        await queryRunner.manager.save(payoutTx);

        // Record platform fee transaction
        // Find a specific admin wallet to credit the platform fee
        const platformEmail = this.configService.get('PLATFORM_ADMIN_EMAIL') || 'agatevureglory@gmail.com';
        const adminUser = await queryRunner.manager.findOne(User, {
            where: { email: platformEmail },
            relations: ['wallet']
        });

        if (adminUser && adminUser.wallet) {
            const adminWallet = adminUser.wallet;
            adminWallet.balance = Number(adminWallet.balance) + Number(consultation.platformFee);
            await queryRunner.manager.save(adminWallet);

            const feeTx = new Transaction();
            feeTx.wallet = adminWallet;
            feeTx.amount = consultation.platformFee;
            feeTx.type = TransactionType.PLATFORM_FEE;
            feeTx.reference = `FEE-${consultation.id}`;
            feeTx.status = TransactionStatus.COMPLETED;
            feeTx.metadata = { 
                consultationId: consultation.id, 
                note: 'Platform Fee Income',
                specialistId: consultation.specialist.id 
            };
            await queryRunner.manager.save(feeTx);
            this.logger.log(`Platform fee of ${consultation.platformFee} credited to admin ${adminUser.email}`);
        } else {
            this.logger.warn(`No admin wallet found to credit platform fee for consultation ${consultation.id}`);
            // Fallback: Record it under specialist wallet as a deduction (as before) but balance won't change
            const feeTx = new Transaction();
            feeTx.wallet = specialistWallet;
            feeTx.amount = consultation.platformFee;
            feeTx.type = TransactionType.PLATFORM_FEE;
            feeTx.reference = `FEE-${consultation.id}`;
            feeTx.status = TransactionStatus.COMPLETED;
            feeTx.metadata = { consultationId: consultation.id, note: 'Platform Fee Deduction (No Admin Wallet Found)' };
            await queryRunner.manager.save(feeTx);
        }

        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException('Payout execution failed: ' + err.message);
    } finally {
        await queryRunner.release();
    }
  }

  async adminReleasePayout(consultationId: string, adminNote: string) {
    const consultation = await this.findOne(consultationId);
    if (consultation.payoutStatus === PayoutStatus.PAID) {
        throw new BadRequestException('Already paid');
    }
    consultation.payoutNote = `Admin Override: ${adminNote}`;
    return this.executePayout(consultation);
  }

  async cancelConsultation(consultationId: string, userId: string) {
    const consultation = await this.findOne(consultationId);

    if (![ConsultationStatus.UPCOMING, ConsultationStatus.CONFIRMED].includes(consultation.status)) {
      throw new BadRequestException('Only upcoming or confirmed consultations can be cancelled');
    }

    const isSpecialist = userId === consultation.specialist.id;
    let refundRatio = 1; // Default to full refund

    if (!isSpecialist) {
        // Patient Cancellation - Apply tiered refund policy
        const now = new Date();
        const scheduledTime = consultation.scheduledAt ? new Date(consultation.scheduledAt) : null;
        
        if (scheduledTime && consultation.status === ConsultationStatus.CONFIRMED) {
            const diffHours = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            const pctGt48 = Number(this.configService.get('REFUND_PERCENT_GT_48H') || 100);
            const pct24To48 = Number(this.configService.get('REFUND_PERCENT_24_48H') || 50);
            const pctLt24 = Number(this.configService.get('REFUND_PERCENT_LT_24H') || 0);

            if (diffHours > 48) {
                refundRatio = pctGt48 / 100;
            } else if (diffHours >= 24) {
                refundRatio = pct24To48 / 100;
            } else {
                refundRatio = pctLt24 / 100;
            }
        } else {
            // If it's not confirmed yet, always 100% refund
            refundRatio = 1;
        }
    }

    const res = await this.processRefund(consultation, refundRatio, isSpecialist);

    // Notify both parties
    const participants = [consultation.patient, consultation.specialist];
    for (const p of participants) {
      const isRecipientSpecialist = p.id === consultation.specialist.id;
      const refundInfo = refundRatio < 1 ? ` (Refund: ${refundRatio * 100}%)` : '';
      
      await this.emailService.sendCancellationNotification(
          p.email,
          'Consultation Cancelled',
          isSpecialist ? 'Cancelled by specialist' : `Cancelled by patient${refundInfo}`,
          p.fullName || p.email.split('@')[0]
      );
      await this.notificationsService.sendNotification(
          p.id, 
          'Consultation Cancelled', 
          isRecipientSpecialist && !isSpecialist ? `Patient cancelled. Refund applied: ${refundRatio * 100}%` : 'A scheduled meeting has been removed.', 
          'cancellation'
      );
    }

    return res;
  }

  async adminRefundConsultation(id: string, adminNote: string) {
    const consultation = await this.findOne(id);
    if (consultation.payoutStatus === PayoutStatus.PAID) {
        throw new BadRequestException('Cannot refund a consultation that has already been paid out');
    }
    
    consultation.payoutNote = `Admin Refund: ${adminNote}`;
    return this.processRefund(consultation, 1, true);
  }

  private async processRefund(consultation: Consultation, refundRatio: number, isSpecialistInitiated: boolean = false) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const originalStatus = consultation.status;
      const finalStatus = isSpecialistInitiated ? ConsultationStatus.DECLINED : ConsultationStatus.CANCELLED;
      
      // Update status if it's not already terminal
      if (![ConsultationStatus.DECLINED, ConsultationStatus.CANCELLED].includes(consultation.status)) {
        consultation.status = finalStatus;
      }
      
      consultation.payoutStatus = PayoutStatus.REFUNDED;
      await queryRunner.manager.save(consultation);

      const refundAmount = Number(consultation.totalFee) * refundRatio;

      if (refundAmount > 0) {
        const patientWallet = await this.walletService.getBalance(consultation.patient.id);
        patientWallet.balance = Number(patientWallet.balance) + refundAmount;
        await queryRunner.manager.save(patientWallet);

        await this.walletService.createTransaction(
          consultation.patient.id,
          refundAmount,
          TransactionType.REFUND,
          `REFUND-${consultation.id}-${Date.now()}`,
          TransactionStatus.COMPLETED,
          { consultationId: consultation.id, note: 'Consultation Refund' }
        );
      }

      await queryRunner.commitTransaction();

      // Activity Logs
      await this.activitiesService.create(consultation.patient.id, 'CONSULTATION_CANCELLED', 'Consultation Refunded', `Your payment for consultation with ${consultation.specialist.fullName} has been refunded.`);
      await this.activitiesService.create(consultation.specialist.id, 'CONSULTATION_CANCELLED', 'Consultation Cancelled', `The consultation with ${consultation.patient.fullName} has been cancelled.`);

      return { status: 'refunded', refundAmount };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async useFollowUp(consultationId: string) {
    const consultation = await this.findOne(consultationId);
    if (consultation.status !== ConsultationStatus.COMPLETED) {
      throw new BadRequestException('Can only follow-up on completed consultations');
    }
    if (consultation.followUpUsed >= consultation.followUpCount) {
      throw new BadRequestException('No follow-up sessions remaining');
    }
    consultation.followUpUsed += 1;
    return this.consultationsRepository.save(consultation);
  }

  async addReview(consultationId: string, patientId: string, reviewDto: { rating: number; comment: string }) {
    const consultation = await this.findOne(consultationId);

    if (consultation.patient.id !== patientId) {
      throw new BadRequestException('Only the patient of this consultation can leave a review');
    }

    if (![ConsultationStatus.COMPLETED, ConsultationStatus.PENDING_PAYOUT, ConsultationStatus.ARCHIVED].includes(consultation.status)) {
      throw new BadRequestException('Can only review completed consultations');
    }

    // Find specialist profile
    const specialistProfile = await this.dataSource.getRepository(SpecialistProfile).findOne({
      where: { user: { id: consultation.specialist.id } }
    });

    if (!specialistProfile) {
      throw new NotFoundException('Specialist profile not found');
    }

    // AI Sentiment Analysis
    const sentimentResult = await this.aiService.analyzeReviewSentiment(reviewDto.comment);

    const review = {
      ...reviewDto,
      patientName: consultation.patient.fullName || consultation.patient.email.split('@')[0],
      patientId: consultation.patient.id,
      date: new Date(),
      aiSentiment: sentimentResult.sentiment,
      aiTags: sentimentResult.tags
    };

    if (sentimentResult.shouldFlag) {
        consultation.payoutStatus = PayoutStatus.HELD;
        consultation.payoutNote = 'AI flagged this review for manual review: ' + sentimentResult.tags.join(', ');
        await this.consultationsRepository.save(consultation);
        
        // Notify Admin (Activity Log)
        await this.activitiesService.create(patientId, 'REVIEW_FLAGGED', 'Review Flagged by AI', `A review for specialist ${consultation.specialist.fullName} was flagged for manual review.`);
    }

    if (!specialistProfile.reviews) {
      specialistProfile.reviews = [];
    }

    // Upsert logic: find existing review by this patient
    const existingIndex = specialistProfile.reviews.findIndex(r => r.patientId === consultation.patient.id);
    
    if (existingIndex > -1) {
        // Update existing review
        specialistProfile.reviews[existingIndex] = review;
    } else {
        // Add new review
        specialistProfile.reviews.push(review);
    }

    // Calculate new average rating based on deduplicated reviews
    const totalRating = specialistProfile.reviews.reduce((acc, curr) => acc + Number(curr.rating), 0);
    specialistProfile.rating = specialistProfile.reviews.length > 0 
        ? totalRating / specialistProfile.reviews.length 
        : 0;

    await this.dataSource.getRepository(SpecialistProfile).save(specialistProfile);

    // Also link review metadata to consultation if needed, but profile is enough for search
    return { status: 'success', message: 'Review added' };
  }

  async updateMeetingDetails(consultationId: string, specialistId: string, dto: { meetingLink?: string; meetingAddress?: string }) {
    const consultation = await this.findOne(consultationId);

    if (consultation.specialist.id !== specialistId) {
      throw new BadRequestException('Only the assigned specialist can update meeting details');
    }

    if (dto.meetingLink) consultation.meetingLink = dto.meetingLink;
    if (dto.meetingAddress) consultation.meetingAddress = dto.meetingAddress;

    await this.consultationsRepository.save(consultation);

    // Activity Logs
    await this.activitiesService.create(consultation.specialist.id, 'MEETING_UPDATED', 'Meeting Details Updated', `You updated the meeting info for ${consultation.patient.fullName}.`);
    await this.activitiesService.create(consultation.patient.id, 'MEETING_UPDATED', 'Meeting Details Updated', `Meeting info for your consultation with ${consultation.specialist.fullName} has been updated.`);

    // Notify patient
    await this.notificationsService.sendNotification(
      consultation.patient.id,
      'Meeting Details Updated',
      `Your specialist has updated the meeting details for your upcoming consultation.`,
      'appointment'
    );

    return consultation;
  }

  async generateAiSummary(id: string) {
      const messages = await this.messagesRepository.find({
          where: { chatRoom: { consultation: { id } } },
          relations: ['sender'],
          order: { createdAt: 'ASC' }
      });

      if (messages.length === 0) return;

      const chatHistory = messages.map(m => `${m.sender?.fullName || 'User'}: ${m.content}`).join('\n');
      const summary = await this.aiService.generateConsultationSummary(chatHistory);
      
      if (summary) {
          await this.consultationsRepository.update(id, { aiSummary: summary });
      }
  }

  async checkIn(id: string, userId: string) {
    const consultation = await this.findOne(id);
    if (consultation.patient.id === userId) {
        consultation.isPatientCheckedIn = true;
    } else if (consultation.specialist.id === userId) {
        consultation.isSpecialistCheckedIn = true;
    } else {
        throw new BadRequestException('User not part of this consultation');
    }

    await this.consultationsRepository.save(consultation);

    return `
        <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #2E7D32;">✓ Checked In Successfully</h1>
                <p>Thank you for verifying your availability.</p>
                <p>Please return to the Rubimedik app to start your consultation.</p>
            </body>
        </html>
    `;
  }
}
