import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodRequest } from './entities/blood-request.entity';
import { DonationMatch } from './entities/donation-match.entity';
import { HospitalFeedback } from './entities/hospital-feedback.entity';
import { DonorFeedback } from './entities/donor-feedback.entity';
import { User } from '../users/entities/user.entity';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { ActivitiesModule } from '../activities/activities.module';
import { AiModule } from '../ai/ai.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DonationsScheduler } from './donations-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BloodRequest, DonationMatch, HospitalFeedback, DonorFeedback, User]),
    ActivitiesModule,
    ConfigModule,
    AiModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [DonationsController],
  providers: [DonationsService, DonationsScheduler],
  exports: [DonationsService],
})
export class DonationsModule {}
