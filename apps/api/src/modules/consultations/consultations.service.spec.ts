import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConsultationsService } from './consultations.service';
import { Consultation } from './entities/consultation.entity';
import { Appointment } from './entities/appointment.entity';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '@nestjs/config';
import { ConsultationStatus, UserRole } from '@repo/shared';
import { BadRequestException } from '@nestjs/common';

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  let repo: any;
  let walletService: any;
  let configService: any;
  let dataSource: any;

  const getMockConsultation = () => ({
    id: 'cons-1',
    totalFee: 10000,
    status: ConsultationStatus.UPCOMING,
    patient: { id: 'patient-1' },
    specialist: { id: 'spec-1' },
    specialistPayout: 8000,
    appointments: [],
  });

  const mockWallet = {
    balance: 20000,
    points: 10,
  };

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockWalletService = {
      getBalance: jest.fn().mockResolvedValue({ ...mockWallet }),
      createTransaction: jest.fn().mockResolvedValue({}),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(500),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        {
          provide: getRepositoryToken(Consultation),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockRepo,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ConsultationsService>(ConsultationsService);
    repo = module.get(getRepositoryToken(Consultation));
    walletService = module.get(WalletService);
    configService = module.get(ConfigService);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bookConsultation', () => {
    it('should successfully book a consultation with wallet balance', async () => {
      const result = await service.bookConsultation('patient-1', 'spec-1', 10000);
      expect(result).toBeDefined();
      expect(result.totalFee).toBe(10000);
      expect(walletService.createTransaction).toHaveBeenCalledWith(
        'patient-1',
        10000,
        expect.anything(),
        expect.any(String),
        expect.anything(),
        expect.any(Object)
      );
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      walletService.getBalance.mockResolvedValueOnce({ balance: 5000, points: 0 });
      await expect(service.bookConsultation('patient-1', 'spec-1', 10000)).rejects.toThrow(BadRequestException);
    });

    it('should successfully book using referral points', async () => {
      const result = await service.bookConsultation('patient-1', 'spec-1', 10000, true);
      expect(result).toBeDefined();
      expect(walletService.createTransaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('completeConsultation', () => {
    it('should complete and payout to specialist', async () => {
      repo.findOne.mockResolvedValue(getMockConsultation());
      walletService.getBalance.mockResolvedValueOnce({ balance: 0 });

      const result = await service.completeConsultation('cons-1');
      expect(result.status).toBe(ConsultationStatus.COMPLETED);
      expect(walletService.createTransaction).toHaveBeenCalledWith(
        'spec-1',
        8000,
        expect.anything(),
        expect.any(String),
        expect.anything(),
        expect.any(Object)
      );
    });
  });

  describe('cancelConsultation', () => {
    it('should provide full refund if patient cancels > 48h before', async () => {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 3);
      
      const consWithAppt = { ...getMockConsultation(), appointments: [{ scheduledAt }] };
      repo.findOne.mockResolvedValue(consWithAppt);
      walletService.getBalance.mockResolvedValue({ balance: 0 });

      const result = await service.cancelConsultation('cons-1', 'patient-1');
      expect(result.refundAmount).toBe(10000);
    });

    it('should provide 50% refund if patient cancels between 24-48h', async () => {
      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + 30);
      
      const consWithAppt = { ...getMockConsultation(), appointments: [{ scheduledAt }] };
      repo.findOne.mockResolvedValue(consWithAppt);
      walletService.getBalance.mockResolvedValue({ balance: 0 });

      const result = await service.cancelConsultation('cons-1', 'patient-1');
      expect(result.refundAmount).toBe(5000);
    });

    it('should provide NO refund if patient cancels < 24h', async () => {
      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + 2);
      
      const consWithAppt = { ...getMockConsultation(), appointments: [{ scheduledAt }] };
      repo.findOne.mockResolvedValue(consWithAppt);
      walletService.getBalance.mockResolvedValue({ balance: 0 });

      const result = await service.cancelConsultation('cons-1', 'patient-1');
      expect(result.refundAmount).toBe(0);
    });
  });
});
