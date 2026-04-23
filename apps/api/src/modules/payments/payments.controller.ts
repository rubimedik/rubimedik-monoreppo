import { TransactionStatus } from '@repo/shared';
import { Controller, Post, Body, Headers, UnauthorizedException, UseGuards, Request, Get, Param, Delete, Logger, Query, Inject, forwardRef, RawBodyRequest, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as crypto from 'crypto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private paymentsService: PaymentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('charge-card')
  @ApiOperation({ summary: 'Charge a card using token or authorization_code' })
  async chargeCard(@Request() req, @Body() body: { amount: number; token?: string; authorization_code?: string; pin?: string; card?: any; type?: string }) {
    const paymentType = body.type || 'CONSULTATION_PAYMENT';
    const result = await this.paymentsService.chargeCard({
      email: req.user.email,
      amount: body.amount,
      token: body.token,
      authorization_code: body.authorization_code,
      pin: body.pin,
      card: body.card,
      metadata: {
        userId: req.user.userId,
        type: paymentType,
      },
    });

    await this.processSuccessfulPayment(req.user.userId, result);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('submit-otp')
  @ApiOperation({ summary: 'Submit OTP for card charge' })
  async submitOtp(@Request() req, @Body() body: { reference: string; otp: string }) {
    const result = await this.paymentsService.submitOtp(body.reference, body.otp);
    await this.processSuccessfulPayment(req.user.userId, result);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('submit-pin')
  @ApiOperation({ summary: 'Submit PIN for card charge' })
  async submitPin(@Request() req, @Body() body: { reference: string; pin: string }) {
    const result = await this.paymentsService.submitPin(body.reference, body.pin);
    await this.processSuccessfulPayment(req.user.userId, result);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('initialize-transfer')
  @ApiOperation({ summary: 'Initialize bank transfer (Manual)' })
  async initializeTransfer(@Request() req, @Body('amount') amount: number) {
    const wallet = await this.walletService.getBalance(req.user.userId);
    return {
      status: 'success',
      account_number: wallet.accountNumber,
      account_name: wallet.accountName,
      bank: {
        name: wallet.bankName,
      },
      amount,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify transaction or transfer' })
  async verify(@Param('reference') reference: string) {
    const isMock = reference.includes('_MOCK_') || reference.startsWith('WDL-');
    const isDev = this.configService.get('NODE_ENV') !== 'production';

    this.logger.log(`Verifying reference: ${reference}. isMock: ${isMock}, isDev: ${isDev}, NODE_ENV: ${this.configService.get('NODE_ENV')}`);

    if (isMock && isDev) {
      this.logger.log(`Mocking verification for reference: ${reference}`);
      
      // If it is a withdrawal (starts with WDL-), ensure it is marked as completed in our DB
      if (reference.startsWith('WDL-')) {
          await this.walletService.completeWithdrawal(reference, TransactionStatus.COMPLETED);
      }
      
      return { 
        status: 'success', 
        data: { status: 'success', reference, amount: 0, gateway_response: 'Mocked Success' } 
      };
    }
    // 1. Try verify as charge transaction
    let data = await this.paymentsService.verifyTransaction(reference);
    
    if (data && (data.status === 'success' || data.status === 'failed')) {
        const status = data.status === 'success' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED;
        // Logic to update wallet if not already done
        // For simplicity, we reuse the webhook logic if it was a charge
        if (data.status === 'success') {
            await this.processSuccessfulPayment(null, data); // userId handled inside metadata
        }
        return { status: data.status, data };
    }

    // 2. Try verify as transfer (withdrawal)
    data = await this.paymentsService.verifyTransfer(reference);
    if (data && (data.status === 'success' || data.status === 'failed' || data.status === 'reversed')) {
        const status = data.status === 'success' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED;
        await this.walletService.completeWithdrawal(reference, status);
        return { status: data.status, data };
    }

    return { status: 'pending', data };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('cards')
  @ApiOperation({ summary: 'List saved cards' })
  async listCards(@Request() req) {
    return this.paymentsService.listSavedCards(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('cards/:id')
  @ApiOperation({ summary: 'Delete a saved card' })
  async deleteCard(@Request() req, @Param('id') id: string) {
    return this.paymentsService.deleteCard(req.user.userId, id);
  }

  @Get('banks')
  @ApiOperation({ summary: 'Get list of banks' })
  async getBanks() {
    return this.paymentsService.getBanks();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('resolve-account')
  @ApiOperation({ summary: 'Resolve bank account name' })
  async resolveAccount(
    @Query('account_number') accountNumber: string,
    @Query('bank_code') bankCode: string,
  ) {
    return this.paymentsService.resolveAccountNumber(accountNumber, bankCode);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Paystack Callback Redirect' })
  async handleCallback(@Query('reference') reference: string) {
    this.logger.log(`Paystack Callback received for reference: ${reference}`);
    return {
      message: 'Payment redirection successful',
      reference,
      status: 'Check your app for payment status'
    };
  }

  @Post('simulate-deposit')
  @ApiOperation({ summary: 'Simulate Inbound DVA Deposit (Dev Only)' })
  async simulateDeposit(@Body() body: { accountNumber: string, amount: number }) {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new UnauthorizedException('Simulation not allowed in production');
    }
    return this.paymentsService.simulateDvaDeposit(body.accountNumber, body.amount);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Paystack Webhook' })
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string, 
    @Request() req: RawBodyRequest<any>
  ) {
    this.logger.log(`Paystack Webhook received: ${req.body?.event}`);
    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    const rawBody = req.rawBody;

    if (!rawBody) {
      this.logger.error('No raw body found in webhook request');
      throw new UnauthorizedException('Missing body');
    }

    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    if (hash !== signature) {
      this.logger.error('Invalid Paystack Webhook Signature');
      throw new UnauthorizedException('Invalid signature');
    }

    const body = JSON.parse(rawBody.toString());
    const event = body.event;
    const data = body.data;

    this.logger.log(`Paystack Webhook Event: ${event}`);

    if (event === 'charge.success') {
      const { metadata, amount, reference, authorization, customer } = data;
      const actualAmount = amount / 100;

      if (!metadata || !metadata.userId) {
          // Look up by customer code first
          if (customer && customer.customer_code) {
              const wallet = await this.walletService['walletRepository'].findOne({
                  where: { customerCode: customer.customer_code },
                  relations: ['user']
              });
              if (wallet) {
                  await this.walletService.fundWallet(wallet.user.id, actualAmount, reference, data);
                  return { status: 'success' };
              }
          }
          
          // Fallback: Look up by Dedicated Account Number directly (Common for simulated deposits)
          const dva = data.dedicated_account;
          if (dva && dva.account_number) {
              const wallet = await this.walletService['walletRepository'].findOne({
                  where: { accountNumber: dva.account_number },
                  relations: ['user']
              });
              if (wallet) {
                  this.logger.log(`Webhook: Found wallet by DVA account number: ${dva.account_number}`);
                  await this.walletService.fundWallet(wallet.user.id, actualAmount, reference, data);
                  return { status: 'success' };
              }
          }
      }

      if (metadata && metadata.userId) {
        if (metadata.type === 'WALLET_TOPUP' || metadata.type === 'WALLET_FUNDING') {
            await this.walletService.fundWallet(metadata.userId, actualAmount, reference, data);
        } else if (metadata.type === 'CONSULTATION_PAYMENT') {
            this.logger.log(`Consultation payment successful for user ${metadata.userId}`);
            await this.walletService.createTransaction(metadata.userId, actualAmount, metadata.type as any, reference, data);
        }
        
        if (authorization && authorization.reusable) {
          await this.paymentsService.saveCard(metadata.userId, authorization);
        }
      }
    } else if (event === 'transfer.success') {
      await this.walletService.completeWithdrawal(data.reference, TransactionStatus.COMPLETED);
    } else if (event === 'transfer.failed') {
      await this.walletService.completeWithdrawal(data.reference, TransactionStatus.FAILED);
    }

    return { status: 'success' };
  }

  private async processSuccessfulPayment(userId: string, result: any) {
    if (!result || (result.status !== 'success' && result.status !== true)) return;

    const metadata = result.metadata || {};
    const type = metadata.type || 'CONSULTATION_PAYMENT';
    const amount = result.amount / 100; 
    const reference = result.reference;

    this.logger.log(`Processing successful payment: ${type} for user ${userId} (Synchronous Fallback)`);

    try {
      if (type === 'WALLET_TOPUP' || type === 'WALLET_FUNDING') {
        await this.walletService.fundWallet(userId, amount, reference, result);
      } else if (type === 'CONSULTATION_PAYMENT') {
        await this.walletService.createTransaction(userId, amount, type as any, reference, result);
      }

      if (result.authorization && result.authorization.reusable) {
        await this.paymentsService.saveCard(userId, result.authorization);
      }
    } catch (e) {
      this.logger.error(`Failed to process successful payment fallback: ${e.message}`);
    }
  }
}
