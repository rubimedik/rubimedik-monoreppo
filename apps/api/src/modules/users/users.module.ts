import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { ReferralCode } from '../referrals/entities/referral-code.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';
import { TrustScoreService } from './trust-score.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet, ReferralCode, PatientProfile]),
    EmailModule,
    StorageModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, TrustScoreService],
  exports: [UsersService, TrustScoreService],
})
export class UsersModule {}
