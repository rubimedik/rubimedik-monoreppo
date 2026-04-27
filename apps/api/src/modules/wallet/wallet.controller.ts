import { Controller, Get, Post, Body, UseGuards, Request, Query, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { PaystackService } from './paystack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitializeFundingDto } from './dto/initialize-funding.dto';
import { TransferDto } from './dto/transfer.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransactionType } from '@repo/shared';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paystackService: PaystackService,
  ) {}

  @Version('1')
  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Version('1')
  @Get('statement')
  @ApiOperation({ summary: 'Download transaction statement as CSV' })
  async getStatement(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.walletService.generateStatementCSV(req.user.userId, startDate, endDate);
  }

  @Version('1')
  @Post('statement/email')
  @ApiOperation({ summary: 'Send transaction statement via email' })
  async sendStatementEmail(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.walletService.sendStatementToEmail(req.user.userId, startDate, endDate);
  }

  @Version('1')
  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getTransactions(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.walletService.getTransactions(
      req.user.userId, 
      page ? Number(page) : 1, 
      limit ? Number(limit) : 10, 
      type as any,
      startDate,
      endDate
    );
  }

  @Version('1')
  @Post('fund/initialize')
  @ApiOperation({ summary: 'Initialize wallet funding' })
  async initializeFunding(@Request() req, @Body() initializeFundingDto: InitializeFundingDto) {
    return this.paystackService.initializeTransaction(req.user.email, initializeFundingDto.amount, {
      userId: req.user.userId,
      type: 'WALLET_FUNDING',
    });
  }

  @Version('1')
  @Get('fund/verify')
  @ApiOperation({ summary: 'Verify wallet funding' })
  @ApiQuery({ name: 'reference', required: true, type: String })
  async verifyFunding(@Request() req, @Query('reference') reference: string) {
    const data = await this.paystackService.verifyTransaction(reference);

    if (data.status === 'success') {
      const amount = data.amount / 100; // kobo to NGN
      return this.walletService.fundWallet(req.user.userId, amount, reference, data);
    }

    return data;
  }

  @Version('1')
  @Post('transfer')
  @ApiOperation({ summary: 'Transfer funds to another user' })
  async transfer(@Request() req, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(req.user.userId, transferDto.email, transferDto.amount, transferDto.note);
  }

  @Version('1')
  @Post('pay-consultation')
  @ApiOperation({ summary: 'Pay for a medical consultation using wallet balance' })
  async payConsultation(@Request() req, @Body() body: { amount: number, consultationId: string }) {
    return this.walletService.payForConsultation(req.user.userId, body.amount, body.consultationId);
  }

  @Version('1')
  @Post('redeem-points')
  @ApiOperation({ summary: 'Redeem referral points to wallet balance' })
  async redeemPoints(@Request() req, @Body() redeemPointsDto: RedeemPointsDto) {
    return this.walletService.redeemPoints(req.user.userId, redeemPointsDto.points);
  }

  @Version('1')
  @Post('withdraw')
  @ApiOperation({ summary: 'Request a withdrawal to bank account' })
  async withdraw(@Request() req, @Body() withdrawDto: WithdrawDto) {
    return this.walletService.requestWithdrawal(req.user.userId, withdrawDto.amount, {
      bankCode: withdrawDto.bankCode,
      accountNumber: withdrawDto.accountNumber,
      accountName: withdrawDto.accountName,
      note: withdrawDto.note
    });
  }

  @Version('1')
  @Get('banks')
  @ApiOperation({ summary: 'List all supported banks from Paystack' })
  async listBanks() {
    return this.paystackService.listBanks();
  }

  @Version('1')
  @Get('banks/resolve')
  @ApiOperation({ summary: 'Resolve a bank account number to a name' })
  @ApiQuery({ name: 'accountNumber', type: String })
  @ApiQuery({ name: 'bankCode', type: String })
  async resolveAccount(
    @Query('accountNumber') accountNumber: string,
    @Query('bankCode') bankCode: string,
  ) {
    return this.paystackService.resolveAccountNumber(accountNumber, bankCode);
  }
}
