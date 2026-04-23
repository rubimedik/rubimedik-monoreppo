import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SavedCard } from './entities/saved-card.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedCard]),
    forwardRef(() => WalletModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
