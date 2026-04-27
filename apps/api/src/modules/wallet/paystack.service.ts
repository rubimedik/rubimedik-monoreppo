import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
const Paystack = require('paystack');

@Injectable()
export class PaystackService {
  private paystack: any;
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.paystack = Paystack(this.secretKey);
  }

  async listBanks() {
    try {
      const response = await axios.get('https://api.paystack.co/bank', {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      });
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to fetch banks from Paystack: ' + error.message);
      throw new InternalServerErrorException('Could not fetch bank list');
    }
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string) {
    try {
      const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      });
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to resolve account number: ' + error.response?.data?.message || error.message);
      throw new BadRequestException(error.response?.data?.message || 'Could not resolve account name');
    }
  }

  async initializeTransaction(email: string, amount: number, metadata: any) {
    try {
      const response = await this.paystack.transaction.initialize({
        email,
        amount: amount * 100, // Paystack amount is in kobo
        metadata,
        callback_url: `${this.configService.get<string>('APP_URL')}/payments/verify`,
      });

      if (!response.status) {
        throw new InternalServerErrorException(response.message);
      }

      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await this.paystack.transaction.verify(reference);
      if (!response.status) {
        throw new InternalServerErrorException(response.message);
      }
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
