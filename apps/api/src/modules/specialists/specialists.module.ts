import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialistProfile } from './entities/specialist-profile.entity';
import { SpecialistsService } from './specialists.service';
import { SpecialistsController } from './specialists.controller';
import { User } from '../users/entities/user.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { Appointment } from '../consultations/entities/appointment.entity';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SpecialistProfile, User, Consultation, Appointment]),
    ActivitiesModule,
  ],
  controllers: [SpecialistsController],
  providers: [SpecialistsService],
  exports: [SpecialistsService],
})
export class SpecialistsModule {}
