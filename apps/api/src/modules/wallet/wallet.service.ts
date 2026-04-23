import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionType, TransactionStatus } from '@repo/shared';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private dataSource: DataSource,
    private configService: ConfigService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  async getBalance(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Auto-create DVA if missing or if it's a test account in production
    const isTestAccount = wallet.bankName === 'Test Bank' || wallet.bankName?.includes('Paystack');
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    if (!wallet.accountNumber || (isProduction && isTestAccount)) {
        this.logger.log(`Refreshing virtual account for user ${userId} (Prod check: ${isProduction})`);
        wallet = await this.createDedicatedAccount(userId);
    }

    return wallet;
  }

  async createDedicatedAccount(userId: string): Promise<Wallet> {
      const wallet = await this.walletRepository.findOne({
          where: { user: { id: userId } },
          relations: ['user']
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      try {
          this.logger.log(`Creating Paystack DVA for user ${userId}`);
          
          const firstName = wallet.user.firstName || wallet.user.fullName?.split(' ')[0] || 'User';
          const lastName = wallet.user.lastName || wallet.user.fullName?.split(' ')[1] || 'Name';
          
          const customer = await this.paymentsService.createCustomer(
              wallet.user.email, 
              firstName, 
              lastName
          );

          const dva = await this.paymentsService.createDedicatedAccount(
              customer.customer_code,
              { firstName, lastName }
          );
          
          if (dva && dva.account_number) {
              wallet.accountNumber = dva.account_number;
              wallet.bankName = dva.bank.name;
              wallet.accountName = dva.account_name;
              wallet.customerCode = customer.customer_code;
              return this.walletRepository.save(wallet);
          }
          
          return wallet;
      } catch (err) {
          this.logger.error('Failed to create DVA', err.stack);
          return wallet;
      }
  }

  async getTransactions(userId: string, page: number = 1, limit: number = 10, type?: TransactionType, startDate?: string, endDate?: string) {
    const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    
    const query = this.transactionsRepository.createQueryBuilder('transaction')
      .where('transaction.walletId = :walletId', { walletId: wallet.id });

    if (type && type !== 'ALL' as any) {
      query.andWhere('transaction.type = :type', { type });
    }

    if (startDate) {
      query.andWhere('transaction.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      // Add 1 day to end date to include the full day
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      query.andWhere('transaction.createdAt < :endDate', { endDate: end.toISOString() });
    }

    const [items, total] = await query
      .orderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async fundWallet(userId: string, amount: number, reference: string, metadata?: any) {
    const wallet = await this.walletRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user']
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const existingTx = await this.transactionsRepository.findOne({ where: { reference } });
    if (existingTx) return wallet;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.increment(Wallet, { id: wallet.id }, "balance", amount);

      const transaction = new Transaction();
      transaction.wallet = wallet;
      transaction.amount = amount;
      transaction.type = TransactionType.WALLET_TOPUP;
      transaction.reference = reference;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.metadata = metadata;

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      try {
          await this.emailService.sendTransactionAlert(
              wallet.user.email, 
              'Wallet Funding', 
              amount, 
              reference,
              null,
              wallet.user.fullName || wallet.user.email.split('@')[0]
          );
          await this.notificationsService.sendNotification(userId, 'Wallet Funded', `Your wallet has been credited with NGN ${amount}.`, 'payment');

      } catch (e) {
          this.logger.error(`Funding notifications failed: ${e.message}`);
      }

      return wallet;
    } catch (err) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async payForConsultation(userId: string, amount: number, consultationId: string) {
    const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (Number(wallet.balance) < Number(amount)) {
        throw new BadRequestException('Insufficient wallet balance');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        await queryRunner.manager.decrement(Wallet, { id: wallet.id }, "balance", amount);

        const transaction = new Transaction();
        transaction.wallet = wallet;
        transaction.amount = amount;
        transaction.type = TransactionType.PAYMENT;
        transaction.status = TransactionStatus.COMPLETED;
        transaction.reference = `CONS-${consultationId.split('-')[0]}-${Date.now()}`;
        transaction.metadata = { consultationId, note: 'Payment for medical consultation' };
        
        await queryRunner.manager.save(transaction);
        
        // Explicitly update consultation status to CONFIRMED once paid
        await queryRunner.manager.update('consultations', consultationId, { status: 'CONFIRMED' });

        await queryRunner.commitTransaction();
        return { status: 'success', balance: Number(wallet.balance) - Number(amount) };
    } catch (err) {
        if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
  }

  async createTransaction(
    userId: string,
    amount: number,
    type: TransactionType,
    reference: string,
    status: TransactionStatus = TransactionStatus.PENDING,
    metadata?: any,
  ) {
    const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const transaction = new Transaction();
    transaction.wallet = wallet;
    transaction.amount = amount;
    transaction.type = type;
    transaction.reference = reference;
    transaction.status = status;
    transaction.metadata = metadata;

    return this.transactionsRepository.save(transaction);
  }

  async findAllTransactions(type?: TransactionType): Promise<Transaction[]> {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    return this.transactionsRepository.find({
      where,
      relations: ['wallet', 'wallet.user'],
      order: { createdAt: 'DESC' }
    });
  }

  async transfer(senderId: string, receiverEmail: string, amount: number, note?: string) {
    const senderWallet = await this.walletRepository.findOne({ where: { user: { id: senderId } }, relations: ['user'] });
    if (!senderWallet) throw new NotFoundException('Wallet not found');

    const receiver = await this.dataSource.getRepository('User').findOne({ 
      where: { email: receiverEmail.toLowerCase().trim() },
      relations: ['wallet']
    }) as any;

    if (!receiver || !receiver['wallet']) {
      throw new NotFoundException('Receiver not found or has no wallet');
    }

    if (senderId === receiver.id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    if (senderWallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const timestamp = Date.now();
      const senderRef = `TRF-S-${timestamp}`;
      const receiverRef = `TRF-R-${timestamp}`;

      await queryRunner.manager.decrement(Wallet, { id: senderWallet.id }, "balance", amount);
      await queryRunner.manager.increment(Wallet, { id: receiver['wallet'].id }, "balance", amount);

      const senderTx = new Transaction();
      senderTx.wallet = senderWallet;
      senderTx.amount = amount;
      senderTx.type = TransactionType.DEBIT;
      senderTx.reference = senderRef;
      senderTx.status = TransactionStatus.COMPLETED;
      senderTx.metadata = { 
        note: note || `Transfer to ${receiver.fullName || receiverEmail}`,
        recipientName: receiver.fullName,
        recipientEmail: receiverEmail,
        senderName: senderWallet.user.fullName,
        senderEmail: senderWallet.user.email,
        type: 'INTERNAL_TRANSFER'
      };
      await queryRunner.manager.save(senderTx);

      const receiverTx = new Transaction();
      receiverTx.wallet = receiver['wallet'];
      receiverTx.amount = amount;
      receiverTx.type = TransactionType.CREDIT;
      receiverTx.reference = receiverRef;
      receiverTx.status = TransactionStatus.COMPLETED;
      receiverTx.metadata = { 
        note: note || `Transfer from ${senderWallet.user.fullName || senderWallet.user.email}`,
        senderName: senderWallet.user.fullName,
        senderEmail: senderWallet.user.email,
        recipientName: receiver.fullName,
        recipientEmail: receiver.email,
        type: 'INTERNAL_TRANSFER'
      };
      await queryRunner.manager.save(receiverTx);

      await queryRunner.commitTransaction();

      try {
          await this.emailService.sendTransactionAlert(
              senderWallet.user.email, 
              'Internal Transfer (Sent)', 
              amount, 
              senderRef, 
              { recipient: receiverEmail },
              senderWallet.user.fullName || senderWallet.user.email.split('@')[0]
          );
          await this.notificationsService.sendNotification(senderId, 'Transfer Sent', `You sent NGN ${amount} to ${receiverEmail}.`, 'payment');
          await this.emailService.sendTransactionAlert(
              receiver.email, 
              'Internal Transfer (Received)', 
              amount, 
              receiverRef, 
              { recipient: senderWallet.user.email },
              receiver.fullName || receiver.email.split('@')[0]
          );
          await this.notificationsService.sendNotification(receiver.id, 'Funds Received', `You received NGN ${amount} from a user.`, 'payment');

      } catch (e) {
          this.logger.error(`Transfer notifications failed: ${e.message}`);
      }

      return { status: 'success', reference: senderRef };
    } catch (err) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async redeemPoints(userId: string, points: number) {
    const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const pointValue = this.configService.get<number>('REFERRAL_POINT_VALUE') || 500;

    if (wallet.points < points) {
      throw new BadRequestException('Insufficient referral points');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const amount = points * pointValue;
      const reference = `RED-${Date.now()}`;

      wallet.points = wallet.points - points;
      await queryRunner.manager.save(wallet);
      await queryRunner.manager.increment(Wallet, { id: wallet.id }, "balance", amount);

      const transaction = new Transaction();
      transaction.wallet = wallet;
      transaction.amount = amount;
      transaction.type = TransactionType.REFERRAL_REDEMPTION;
      transaction.reference = reference;
      transaction.status = TransactionStatus.COMPLETED;
      transaction.metadata = { pointsRedeemed: points, note: 'Points redemption' };
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return { status: 'success', amount };
    } catch (err) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async requestWithdrawal(userId: string, amount: number, bankDetails: { bankCode: string, accountNumber: string, accountName?: string, note?: string }) {
    const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance for withdrawal');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const timestamp = Date.now();
      const reference = `WDL-${timestamp}`;

      // OPTIMIZATION: Check if this is an internal Rubimedik account
      const internalRecipient = await this.walletRepository.findOne({
          where: { accountNumber: bankDetails.accountNumber },
          relations: ['user']
      });

      if (internalRecipient) {
          this.logger.log(`Internal transfer detected to ${internalRecipient.user.email}. Converting to P2P.`);
          await queryRunner.manager.release(); // Close this queryRunner as we'll call transfer()
          return this.transfer(userId, internalRecipient.user.email, amount, bankDetails.note || 'Internal Transfer');
      }

      // 1. Create Paystack Transfer Recipient
      const recipient = await this.paymentsService.createTransferRecipient(
          bankDetails.accountName || wallet.user.fullName || 'User',
          bankDetails.accountNumber,
          bankDetails.bankCode
      );

      // 2. Atomic balance deduction
      await queryRunner.manager.decrement(Wallet, { id: wallet.id }, "balance", amount);

      // 3. Record pending transaction
      await this.createTransaction(
        userId,
        amount,
        TransactionType.TRANSFER_OUT,
        reference,
        TransactionStatus.PENDING,
        { ...bankDetails, recipientCode: recipient.recipient_code, note: bankDetails.note || 'Bank Transfer' }
      );

      // 4. Initiate Paystack Transfer
      await this.paymentsService.initiateTransfer(amount, recipient.recipient_code, `Withdrawal from Rubimedik: ${reference}`, reference);

      await queryRunner.commitTransaction();

      // Notifications
      try {
          await this.emailService.sendTransactionAlert(
              wallet.user.email, 
              'Bank Transfer (Sent)', 
              amount, 
              reference, 
              {
                  recipient: bankDetails.accountNumber,
                  bankName: bankDetails.bankCode
              },
              wallet.user.fullName || wallet.user.email.split('@')[0]
          );
          await this.notificationsService.sendNotification(userId, 'Transfer Initiated', `₦${amount} transfer is being processed.`, 'payment');

      } catch (notifyErr) {
          this.logger.error(`Withdrawal notifications failed: ${notifyErr.message}`);
      }

      return { status: 'pending', reference };
    } catch (err) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async completeWithdrawal(reference: string, status: TransactionStatus) {
    const transaction = await this.transactionsRepository.findOne({ 
      where: { reference },
      relations: ['wallet', 'wallet.user']
    });
    
    if (!transaction) {
      this.logger.error(`Transaction not found for reference: ${reference}`);
      return;
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      this.logger.log(`Transaction ${reference} already has status ${transaction.status}`);
      return;
    }

    transaction.status = status;
    await this.transactionsRepository.save(transaction);

    const userId = transaction.wallet.user.id;
    const amount = transaction.amount;

    if (status === TransactionStatus.COMPLETED) {
      // LOGGING: Check if target was an internal Rubimedik DVA (Verification only)
      const bankDetails = transaction.metadata || {};
      if (bankDetails.accountNumber) {
          const targetWallet = await this.walletRepository.findOne({ 
              where: { accountNumber: bankDetails.accountNumber },
              relations: ['user']
          });
          
          if (targetWallet) {
              this.logger.warn(`WEBHOOK_LOG: Transfer completed but Recipient ${targetWallet.user.email} was NOT credited via this path. If the recipient balance didn't increase, the 'transfer.success' webhook might have failed.`);
          }
      }

      await this.notificationsService.sendNotification(
        userId,
        'Withdrawal Successful',
        `₦${amount} has been sent to your bank account.`,
        'payment'
      );
    } else if (status === TransactionStatus.FAILED) {
      // Refund balance if transfer failed
      await this.walletRepository.increment({ id: transaction.wallet.id }, 'balance', amount);
      
      await this.notificationsService.sendNotification(
        userId,
        'Withdrawal Failed',
        `₦${amount} has been refunded to your wallet.`,
        'payment'
      );
    }
  }

  async generateStatementCSV(userId: string, startDate: string, endDate: string) {
    const { items } = await this.getTransactions(userId, 1, 1000, undefined, startDate, endDate);
    
    const header = 'Date,Reference,Type,Amount,Status,Description\n';
    if (items.length === 0) return header + 'No transactions found for this period\n';

    const rows = items.map(tx => {
      const date = new Date(tx.createdAt).toLocaleString();
      const desc = tx.metadata?.note || tx.type;
      return `"${date}","${tx.reference}","${tx.type}",${tx.amount},"${tx.status}","${desc.replace(/"/g, '""')}"`;
    }).join('\n');

    return header + rows;
  }

  async sendStatementToEmail(userId: string, startDate: string, endDate: string) {
    const wallet = await this.walletRepository.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const csvData = await this.generateStatementCSV(userId, startDate, endDate);
    
    await this.emailService.sendStatement(
      wallet.user.email,
      new Date(startDate),
      new Date(endDate),
      csvData
    );

    return { status: 'success', message: 'Statement sent to email' };
  }
}
