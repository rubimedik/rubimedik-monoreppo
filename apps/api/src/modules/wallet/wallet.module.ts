import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PaystackService } from './paystack.service';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    EmailModule,
    NotificationsModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [WalletController],
  providers: [WalletService, PaystackService],
  exports: [WalletService, PaystackService],
})
export class WalletModule {}
