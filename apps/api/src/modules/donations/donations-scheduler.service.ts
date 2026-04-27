import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DonationMatch } from './entities/donation-match.entity';
import { DonationStatus, UserRole } from '@repo/shared';
import { EmailService } from '../email/email.service';
import { AiService } from '../ai/ai.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DonationsScheduler {
  private readonly logger = new Logger(DonationsScheduler.name);

  constructor(
    @InjectRepository(DonationMatch)
    private donationMatchesRepository: Repository<DonationMatch>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private aiService: AiService,
  ) {}

  @Cron('0 0 * * * *') // Run hourly
  async handleDonorPrepAndRecovery() {
    this.logger.log('Running Donor Pre/Post processing...');
    const now = new Date();

    // 1. PRE-DONATION COACH (24 hours before)
    const tomorrowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingDonations = await this.donationMatchesRepository.find({
      where: {
        status: DonationStatus.CONFIRMED,
        scheduledDate: Between(tomorrowStart, tomorrowEnd)
      },
      relations: ['donor']
    });

    for (const match of upcomingDonations) {
        try {
            const checklist = await this.aiService.generatePreDonationPrep();
            await this.emailService.sendEmail(
                match.donor.email,
                'Your Blood Donation Prep Guide',
                `<p>Hello ${match.donor.fullName || 'Donor'},</p>
                 <p>Your blood donation is tomorrow! Here is your AI-generated preparation checklist:</p>
                 <pre style="font-family: sans-serif; background: #f4f4f4; padding: 15px;">${checklist}</pre>`
            );
        } catch (e) {
            this.logger.error(`Pre-donation coach failed for match ${match.id}: ` + e.message);
        }
    }

    // 2. POST-DONATION RECOVERY (48 hours after)
    const twoDaysAgoStart = new Date(now.getTime() - 49 * 60 * 60 * 1000);
    const twoDaysAgoEnd = new Date(now.getTime() - 47 * 60 * 60 * 1000);

    const completedDonations = await this.donationMatchesRepository.find({
      where: {
        status: DonationStatus.COMPLETED,
        donatedAt: Between(twoDaysAgoStart, twoDaysAgoEnd)
      },
      relations: ['donor']
    });

    for (const match of completedDonations) {
        try {
            const recoveryGuide = await this.aiService.generatePostDonationRecovery();
            await this.emailService.sendEmail(
                match.donor.email,
                'Post-Donation Recovery Guide',
                `<p>Hello ${match.donor.fullName || 'Donor'},</p>
                 <p>Thank you for donating! Here is your 48-hour recovery guide:</p>
                 <div style="font-family: sans-serif; background: #f9f9f9; padding: 20px; border-radius: 12px; line-height: 1.6;">${recoveryGuide}</div>`
            );
        } catch (e) {
            this.logger.error(`Post-donation recovery failed for match ${match.id}: ` + e.message);
        }
    }
  }

  @Cron('0 0 1 * *') // Run 1st of every month
  async handleCommunityImpact() {
      this.logger.log('Generating Monthly Community Impact...');
      
      const donors = await this.usersRepository.find({ where: { activeRole: UserRole.DONOR } });
      
      for (const donor of donors) {
          try {
              // Get donor's stats
              const donations = await this.donationMatchesRepository.find({
                  where: { donor: { id: donor.id }, status: DonationStatus.COMPLETED }
              });

              if (donations.length === 0) continue;

              const totalUnits = donations.reduce((sum, d) => sum + (d.units || 1), 0);
              const summary = await this.aiService.generateCommunityImpact({
                  totalDonations: donations.length,
                  totalUnits,
                  bloodType: donor.bloodGroup,
                  livesSavedEstimate: totalUnits * 3
              });

              await this.emailService.sendEmail(
                  donor.email,
                  'Your Monthly Impact Summary',
                  `<p>Hello ${donor.fullName || 'Hero'},</p>
                   <p>${summary.impactSummary}</p>`
              );
              
              // Also update the donorInsights JSON for the mobile app
              donor.donorInsights = { ...donor.donorInsights, lastImpactSummary: summary.impactSummary };
              await this.usersRepository.save(donor);
          } catch (e) {
              this.logger.error(`Community impact failed for donor ${donor.id}: ` + e.message);
          }
      }
  }

  @Cron('0 0 * * 0') // Every Sunday
  async handleLapsedDonors() {
      this.logger.log('Checking for lapsed donors...');
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const donors = await this.usersRepository.find({ where: { activeRole: UserRole.DONOR } });

      for (const donor of donors) {
          try {
              const lastDonation = await this.donationMatchesRepository.findOne({
                  where: { donor: { id: donor.id }, status: DonationStatus.COMPLETED },
                  order: { donatedAt: 'DESC' }
              });

              if (lastDonation && lastDonation.donatedAt < threeMonthsAgo) {
                  const monthsSinceLast = Math.floor((new Date().getTime() - lastDonation.donatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
                  
                  const messageObj = await this.aiService.generateReengagementMessage({
                      name: donor.fullName || 'Donor',
                      monthsSinceLast,
                      bloodType: donor.bloodGroup
                  });

                  await this.emailService.sendEmail(
                      donor.email,
                      'We Need Your Help Again',
                      `<p>${messageObj.message}</p>
                       <p>Log in to Rubimedik to find blood requests near you.</p>`
                  );
              }
          } catch (e) {
              this.logger.error(`Re-engagement failed for donor ${donor.id}: ` + e.message);
          }
      }
  }
}
