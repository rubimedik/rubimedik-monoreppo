import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { ConfigService } from '@nestjs/config';
import { TransactionType, TransactionStatus } from '@repo/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: any;
  let transactionRepo: any;
  let dataSource: any;

  const mockWallet = {
    id: 'wallet-1',
    balance: 10000,
    points: 100,
    user: { id: 'user-1' },
  };

  beforeEach(async () => {
    const mockWalletRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockWallet }),
      save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
    };

    const mockTransactionRepo = {
      save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
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
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: 'user-2', wallet: { id: 'wallet-2', balance: 0 } }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockWalletRepo,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(500) },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepo = module.get(getRepositoryToken(Wallet));
    transactionRepo = module.get(getRepositoryToken(Transaction));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return wallet for user', async () => {
      const result = await service.getBalance('user-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('wallet-1');
    });

    it('should throw NotFoundException if wallet not found', async () => {
      walletRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getBalance('user-unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('fundWallet', () => {
    it('should increase balance and create transaction', async () => {
      const result = await service.fundWallet('user-1', 5000, 'ref-1');
      expect(result.balance).toBe(15000);
    });
  });

  describe('transfer', () => {
    it('should successfully transfer between wallets', async () => {
      const result = await service.transfer('user-1', 'receiver@example.com', 2000);
      expect(result.status).toBe('success');
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      await expect(service.transfer('user-1', 'receiver@example.com', 50000)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transferring to self', async () => {
      dataSource.getRepository().findOne.mockResolvedValueOnce({ id: 'user-1', wallet: { id: 'wallet-1' } });
      await expect(service.transfer('user-1', 'self@example.com', 100)).rejects.toThrow(BadRequestException);
    });
  });

  describe('redeemPoints', () => {
    it('should successfully redeem points to wallet', async () => {
      // 10 points * 500 = 5000
      const result = await service.redeemPoints('user-1', 10);
      expect(result.status).toBe('success');
      expect(result.newBalance).toBe(15000);
      expect(result.remainingPoints).toBe(90);
    });

    it('should throw BadRequestException if insufficient points', async () => {
      await expect(service.redeemPoints('user-1', 200)).rejects.toThrow(BadRequestException);
    });
  });
});
