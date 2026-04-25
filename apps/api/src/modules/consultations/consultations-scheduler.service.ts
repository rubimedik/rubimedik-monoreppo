import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, Between, In } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { ConsultationStatus, PayoutStatus } from '@repo/shared';
import { ConsultationsService } from './consultations.service';
import { DonationMatch } from '../donations/entities/donation-match.entity';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConsultationsScheduler {
  private readonly logger = new Logger(ConsultationsScheduler.name);

  constructor(
    @InjectRepository(Consultation)
    private consultationsRepository: Repository<Consultation>,
    @InjectRepository(DonationMatch)
    private donationMatchesRepository: Repository<DonationMatch>,
    private consultationsService: ConsultationsService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  @Cron(process.env.CONSULTATION_SCHEDULER_CRON || '0 */10 * * * *')
  async handleLifecycleTransitions() {
    this.logger.log('Running consultation lifecycle transitions check...');

    const now = new Date();
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    // 1. 30-Minute Verification Reminders (Medical)
    const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60000);
    const windowStart = new Date(thirtyMinsFromNow.getTime() - 10 * 60000);
    const windowEnd = new Date(thirtyMinsFromNow.getTime() + 10 * 60000);

    const upcomingConsultations = await this.consultationsRepository.find({
        where: {
            scheduledAt: Between(windowStart, windowEnd),
            checkInReminderSent: false,
            status: ConsultationStatus.CONFIRMED
        },
        relations: ['patient', 'specialist']
    });

    for (const c of upcomingConsultations) {
        try {
            const timeStr = c.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            await this.emailService.sendCheckInVerification(
                c.patient.email,
                c.patient.fullName || 'Patient',
                'Medical Consultation',
                timeStr,
                `${appUrl}/v1/consultations/${c.id}/check-in?userId=${c.patient.id}`
            );
            await this.emailService.sendCheckInVerification(
                c.specialist.email,
                `Dr. ${c.specialist.fullName || 'Specialist'}`,
                'Medical Consultation',
                timeStr,
                `${appUrl}/v1/consultations/${c.id}/check-in?userId=${c.specialist.id}`
            );
            c.checkInReminderSent = true;
            await this.consultationsRepository.save(c);
        } catch (e) {
            this.logger.error(`Failed to send medical check-in reminder for ${c.id}: ${e.message}`);
        }
    }

    // 2. 30-Minute Verification Reminders (Donation)
    const upcomingDonations = await this.donationMatchesRepository.find({
        where: {
            scheduledDate: Between(windowStart, windowEnd),
            checkInReminderSent: false,
        },
        relations: ['donor', 'request', 'request.hospital']
    });

    for (const d of upcomingDonations) {
        try {
            const timeStr = d.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const hospitalName = d.request?.hospital?.hospitalProfile?.hospitalName || 'Hospital';
            await this.emailService.sendCheckInVerification(
                d.donor.email,
                d.donor.fullName || 'Donor',
                'Blood Donation',
                timeStr,
                `${appUrl}/v1/donations/matches/${d.id}/check-in?userId=${d.donor.id}`
            );
            await this.emailService.sendCheckInVerification(
                d.request.hospital.email,
                hospitalName,
                'Blood Donation',
                timeStr,
                `${appUrl}/v1/donations/matches/${d.id}/check-in?userId=${d.request.hospital.id}`
            );
            d.checkInReminderSent = true;
            await this.donationMatchesRepository.save(d);
        } catch (e) {
            this.logger.error(`Failed to send donation check-in reminder for ${d.id}: ${e.message}`);
        }
    }

    // 3. Auto-Archive Chats
    const toArchive = await this.consultationsRepository.find({
      where: {
        // @ts-ignore
        status: Not(In([ConsultationStatus.ARCHIVED, ConsultationStatus.COMPLETED, ConsultationStatus.CANCELLED])),
        chatClosesAt: LessThan(now),
      }
    });

    for (const consultation of toArchive) {
      try {
        this.logger.log(`Archiving chat for consultation ${consultation.id}`);
        // @ts-ignore
        consultation.status = ConsultationStatus.ARCHIVED;
        if (!consultation.chatLockedBy) {
            consultation.chatLockedBy = 'timeout';
        }
        await this.consultationsRepository.save(consultation);
      } catch (err) {
        this.logger.error(`Failed to archive consultation ${consultation.id}: ${err.message}`);
      }
    }

    // 4. Release Automated Payouts
    // Case A: Standard payouts where patient feedback is present
    const query = this.consultationsRepository.createQueryBuilder('consultation')
        .leftJoinAndSelect('consultation.specialist', 'specialist')
        .leftJoinAndSelect('consultation.patient', 'patient')
        .where('consultation.payoutStatus = :payoutStatus', { payoutStatus: PayoutStatus.PENDING })
        .andWhere('consultation.payoutReleasesAt <= :now', { now })
        // @ts-ignore
        .andWhere('consultation.status != :disputedStatus', { disputedStatus: ConsultationStatus.DISPUTED })
        .andWhere("consultation.patientFeedback IS NOT NULL");

    const toPayout = await query.getMany();

    for (const consultation of toPayout) {
      try {
          await this.consultationsService.executePayoutLogicForScheduler(consultation.id);
      } catch (err) {
          this.logger.error(`Automated payout failed for ${consultation.id}: ${err.message}`);
      }
    }

    // Case B: Consultations where payout time has passed but patient HAS NOT submitted feedback
    // These should be moved to HELD status so they don't disappear from the specialist's view without explanation
    const overdueNoFeedback = await this.consultationsRepository.createQueryBuilder('consultation')
        .where('consultation.payoutStatus = :payoutStatus', { payoutStatus: PayoutStatus.PENDING })
        .andWhere('consultation.payoutReleasesAt <= :now', { now })
        .andWhere("consultation.patientFeedback IS NULL")
        .getMany();

    for (const consultation of overdueNoFeedback) {
        try {
            this.logger.log(`Consultation ${consultation.id} overdue with no patient feedback. Moving to HELD.`);
            consultation.payoutStatus = PayoutStatus.HELD;
            consultation.payoutNote = 'Payout held: Waiting for patient feedback or admin review after grace period.';
            // Keep it in PENDING_PAYOUT or ARCHIVED so it's visible
            await this.consultationsRepository.save(consultation);
        } catch (err) {
            this.logger.error(`Failed to handle overdue consultation ${consultation.id}: ${err.message}`);
        }
    }
  }
}
