import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalsService } from './hospitals.service';
import { HospitalsController } from './hospitals.controller';
import { User } from '../users/entities/user.entity';
import { HospitalInventory } from './entities/hospital-inventory.entity';
import { HospitalProfile } from './entities/hospital-profile.entity';
import { BloodRequest } from '../donations/entities/blood-request.entity';
import { DonationMatch } from '../donations/entities/donation-match.entity';
import { ActivitiesModule } from '../activities/activities.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, HospitalInventory, HospitalProfile, BloodRequest, DonationMatch]),
    ActivitiesModule,
    AiModule,
  ],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
