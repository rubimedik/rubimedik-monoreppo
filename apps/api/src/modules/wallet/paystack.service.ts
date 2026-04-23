import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Paystack = require('paystack');

@Injectable()
export class PaystackService {
  private paystack: any;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.paystack = Paystack(secretKey);
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
