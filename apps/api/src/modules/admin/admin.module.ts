import { User } from '../users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module, Global } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SpecialistsModule } from '../specialists/specialists.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { UsersModule } from '../users/users.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { DonationsModule } from '../donations/donations.module';
import { WalletModule } from '../wallet/wallet.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    SpecialistsModule,
    HospitalsModule,
    UsersModule,
    ConsultationsModule,
    DonationsModule,
    WalletModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
