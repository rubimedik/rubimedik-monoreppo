import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './entities/consultation.entity';
import { Appointment } from './entities/appointment.entity';
import { ChatRoom } from '../chat/entities/chat-room.entity';
import { Message } from '../chat/entities/message.entity';
import { DonationMatch } from '../donations/entities/donation-match.entity';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { WalletModule } from '../wallet/wallet.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesModule } from '../activities/activities.module';
import { ConsultationsScheduler } from './consultations-scheduler.service';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, Appointment, ChatRoom, Message, DonationMatch]),
    WalletModule,
    EmailModule,
    NotificationsModule,
    ActivitiesModule,
    AiModule,
    UsersModule,
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, ConsultationsScheduler],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
