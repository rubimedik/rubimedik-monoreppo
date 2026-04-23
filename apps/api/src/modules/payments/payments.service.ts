import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { SavedCard } from './entities/saved-card.entity';

@Injectable()
export class PaymentsService {
  private readonly paystackUrl = 'https://api.paystack.co';
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(SavedCard)
    private savedCardsRepository: Repository<SavedCard>,
  ) {}

  private get headers() {
    const key = this.configService.get<string>('PAYSTACK_SECRET_KEY')?.trim();

    if (!key || !key.startsWith('sk_')) {
      this.logger.error(
        `Invalid or missing PAYSTACK_SECRET_KEY. Key starts with: ${key?.substring(0, 6)}`,
      );
      throw new InternalServerErrorException(
        'Paystack secret key is invalid or not configured',
      );
    }

    return {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  // ─── Customer ────────────────────────────────────────────────────────────────

  async createCustomer(
    email: string,
    first_name?: string,
    last_name?: string,
  ) {
    try {
      const response = await axios.post(
        `${this.paystackUrl}/customer`,
        { email, first_name, last_name },
        { headers: this.headers },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Create Customer Error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to create Paystack customer',
      );
    }
  }

  // ─── Dedicated Virtual Account ───────────────────────────────────────────────

  async getDvaProviders() {
    try {
      const response = await axios.get(
        `${this.paystackUrl}/dedicated_account/available_providers`,
        { headers: this.headers },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack List DVA Providers Error:',
        error.response?.data || error.message,
      );
      return [];
    }
  }

    async createDedicatedAccount(customerCode: string, name: { firstName: string, lastName: string }) {
    try {
      // Internal validation before DVA creation
      await this.validateCustomer(customerCode, {
        firstName: name.firstName,
        lastName: name.lastName,
        type: 'bank_account',
        country: 'NG',
        bvn: '20012345677', // Test BVN
        bankCode: '007',    // Test Bank Code
        accountNumber: '0123456789' // Test Account Number
      });

      const providers = await this.getDvaProviders();
      const payload: any = { customer: customerCode };

      const isProduction = this.configService.get('NODE_ENV') === 'production';

      if (!isProduction) {
        // In dev, prefer test-bank for simulation capabilities
        payload.preferred_bank = 'test-bank';
      } else if (providers && providers.length > 0) {
        payload.preferred_bank = providers[0].slug;
      }

      const response = await axios.post(
        `${this.paystackUrl}/dedicated_account`,
        payload,
        { headers: this.headers }
      );

      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Create DVA Error:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  // Validate customer identity (required before DVA in test & live mode)
  async validateCustomer(
    customerCode: string,
    data: {
      firstName: string;
      lastName: string;
      type: 'bank_account'; // only supported type currently
      country: string;       // e.g. 'NG'
      bvn: string;           // test BVN: '20012345677'
      bankCode: string;
      accountNumber: string;
    },
  ) {
    try {
      const response = await axios.post(
        `${this.paystackUrl}/customer/${customerCode}/identification`,
        {
          first_name: data.firstName,
          last_name: data.lastName,
          type: data.type,
          country: data.country,
          bvn: data.bvn,
          bank_code: data.bankCode,
          account_number: data.accountNumber,
        },
        { headers: this.headers },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Validate Customer Error:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  // ─── Card Charging ────────────────────────────────────────────────────────────

  async chargeCard(data: { card?: any;
    email: string;
    amount: number;
    token?: string;
    authorization_code?: string;
    pin?: string;
    metadata?: any;
  }) {
    // Guard: Ensure we have a way to identify the card
    if (!data.card && !data.token && !data.authorization_code) {
      this.logger.error('chargeCard called without token or authorization_code', data);
      throw new InternalServerErrorException(
        'Either a card token or authorization_code must be provided',
      );
    }

    try {
      const payload: any = {
        email: data.email,
        amount: Math.round(data.amount * 100),
        metadata: data.metadata,
      };

      if (data.card) {
        payload.card = data.card;
      } else if (data.token) {
        payload.card = { token: data.token };
      } else if (data.authorization_code) {
        payload.authorization_code = data.authorization_code;
      }

      if (data.pin) {
        payload.pin = data.pin;
      }

      const response = await axios.post(
        `${this.paystackUrl}/charge`,
        payload,
        { headers: this.headers },
      );

      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Charge Error:',
        error.response?.data || error.message,
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to charge card';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  // ─── OTP / PIN ────────────────────────────────────────────────────────────────

  async submitOtp(reference: string, otp: string) {
    try {
      const response = await axios.post(
        `${this.paystackUrl}/charge/submit_otp`,
        { reference, otp },
        { headers: this.headers },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Submit OTP Error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Failed to submit OTP',
      );
    }
  }

  async submitPin(reference: string, pin: string) {
    try {
      const response = await axios.post(
        `${this.paystackUrl}/charge/submit_pin`,
        { reference, pin },
        { headers: this.headers },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Submit PIN Error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Failed to submit PIN',
      );
    }
  }

  // ─── Transaction ──────────────────────────────────────────────────────────────

  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.paystackUrl}/transaction/verify/${reference}`,
        { headers: this.headers },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Verify Error:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  // ─── Saved Cards ──────────────────────────────────────────────────────────────

  async listSavedCards(userId: string) {
    return this.savedCardsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async saveCard(userId: string, authData: any) {
    // Ensure we don't save duplicates by checking fingerprint or last4 + exp
    // Paystack provides a unique 'fingerprint' for each card
    const existing = await this.savedCardsRepository.findOne({
      where: [
        { 
          user: { id: userId }, 
          last4: authData.last4, 
          expMonth: String(authData.exp_month), 
          expYear: String(authData.exp_year) 
        }
      ]
    });

    if (existing) {
      this.logger.log(`Card already exists for user ${userId}, updating auth code`);
      existing.authorizationCode = authData.authorization_code;
      return this.savedCardsRepository.save(existing);
    }

    const card = this.savedCardsRepository.create({
      user: { id: userId } as any,
      authorizationCode: authData.authorization_code,
      last4: authData.last4,
      expMonth: String(authData.exp_month),
      expYear: String(authData.exp_year),
      cardType: authData.card_type,
      bank: authData.bank,
      brand: authData.brand,
    });

    return this.savedCardsRepository.save(card);
  }

  async deleteCard(userId: string, cardId: string) {
    const card = await this.savedCardsRepository.findOne({
      where: { id: cardId, user: { id: userId } },
    });
    if (!card) throw new NotFoundException('Card not found');
    return this.savedCardsRepository.remove(card);
  }

  // ─── Banks ────────────────────────────────────────────────────────────────────

  async getBanks() {
    try {
      const response = await axios.get(
        `${this.paystackUrl}/bank?country=nigeria`,
        { headers: this.headers },
      );
      let banks = response.data.data;

      // Add Test Bank for development mode
      if (this.configService.get('NODE_ENV') !== 'production') {
        // Remove existing bank with code 007 if present to avoid duplicates
        banks = banks.filter(b => b.code !== '007');
        banks.unshift({
          name: 'Test Bank (Use 0000000000)',
          slug: 'test-bank',
          code: '007', // Common mock code
          longcode: '007007007',
          gateway: null,
          active: true,
          is_deleted: false,
          country: 'Nigeria',
          currency: 'NGN',
          type: 'nuban',
        });
      }

      return banks;
    } catch (error: any) {
      this.logger.error(
        'Paystack Get Banks Error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to fetch banks from Paystack',
      );
    }
  }

  
  async verifyTransfer(reference: string) {
    try {
      const response = await axios.get(
        `${this.paystackUrl}/transfer/verify/${reference}`,
        { headers: this.headers },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Paystack Verify Transfer Error:', error.response?.data || error.message);
      return null;
    }
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string) {
    // Mock resolution for Test Bank in development
    if (bankCode === '007' && this.configService.get('NODE_ENV') !== 'production') {
      return {
        account_number: accountNumber,
        account_name: 'TEST ACCOUNT (SUCCESS)',
        bank_id: 999
      };
    }
    try {
      const response = await axios.get(
        `${this.paystackUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: this.headers },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        'Paystack Resolve Account Error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Could not resolve account name',
      );
    }
  }

  async createTransferRecipient(name: string, accountNumber: string, bankCode: string) {
    // Mock response for Test Bank in development to avoid Paystack resolution errors
    if (bankCode === '007' && this.configService.get('NODE_ENV') !== 'production') {
      this.logger.log(`Mocking transfer recipient for Test Bank: ${accountNumber}`);
      return {
        recipient_code: `RCP_MOCK_${Date.now()}`,
        name,
        details: { account_number: accountNumber, bank_code: '007', bank_name: 'Test Bank' }
      };
    }

    try {
      const response = await axios.post(
        `${this.paystackUrl}/transferrecipient`,
        {
          type: 'nuban',
          name,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: 'NGN',
        },
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Paystack Create Recipient Error:', error.response?.data || error.message);
      throw new InternalServerErrorException(error.response?.data?.message || 'Could not create transfer recipient');
    }
  }

  async initiateTransfer(amount: number, recipientCode: string, reason: string, reference?: string) {
    // Mock success for mocked recipients in development
    if (recipientCode.startsWith('RCP_MOCK_') && this.configService.get('NODE_ENV') !== 'production') {
      this.logger.log(`Mocking successful transfer for recipient: ${recipientCode}`);
      return {
        reference: reference || `TRF_MOCK_${Date.now()}`,
        status: 'success',
        amount,
        transfer_code: `TRN_MOCK_${Date.now()}`
      };
    }

    try {
      const payload: any = {
        source: 'balance',
        amount: Math.round(amount * 100),
        recipient: recipientCode,
        reason,
      };

      if (reference) {
        payload.reference = reference;
      }

      const response = await axios.post(
        `${this.paystackUrl}/transfer`,
        payload,
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Paystack Initiate Transfer Error:', error.response?.data || error.message);
      throw new InternalServerErrorException(error.response?.data?.message || 'Could not initiate transfer');
    }
  }

  async simulateDvaDeposit(accountNumber: string, amount: number) {
    if (this.configService.get('NODE_ENV') === 'production') {
      return { status: 'error', message: 'Not allowed in production' };
    }

    try {
      this.logger.log(`Calling Paystack Simulation for account ${accountNumber} with amount ${amount}`);
      // NOTE: Standard Paystack DVA simulation endpoint
      const response = await axios.post(
        `${this.paystackUrl}/dedicated_account/simulate`,
        {
          account_number: accountNumber,
          amount: Math.round(amount * 100),
        },
        { headers: this.headers },
      );
      
      this.logger.log('Paystack Simulation Response: ' + JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      this.logger.error('DVA Simulate Error:', error.response?.data || error.message);
      // Fallback: If v1 /simulate is 404, we might be on a specific region/version, 
      // but standard Paystack API for DVA is /dedicated_account/simulate
      return { 
        status: 'error', 
        message: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }
}