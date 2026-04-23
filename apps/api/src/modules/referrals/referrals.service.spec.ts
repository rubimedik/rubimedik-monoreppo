import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReferralsService } from './referrals.service';
import { Referral } from './entities/referral.entity';
import { ReferralCode } from './entities/referral-code.entity';
import { ReferralStatus, UrgencyLevel } from '@repo/shared';
import { NotFoundException } from '@nestjs/common';

describe('ReferralsService', () => {
  let service: ReferralsService;
  let referralRepo: any;
  let codeRepo: any;

  beforeEach(async () => {
    const mockReferralRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((val) => Promise.resolve(val)),
    };

    const mockCodeRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        {
          provide: getRepositoryToken(Referral),
          useValue: mockReferralRepo,
        },
        {
          provide: getRepositoryToken(ReferralCode),
          useValue: mockCodeRepo,
        },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
    referralRepo = module.get(getRepositoryToken(Referral));
    codeRepo = module.get(getRepositoryToken(ReferralCode));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByCode', () => {
    it('should return referral code if found', async () => {
      const mockCode = { code: 'RUBI-123', user: { id: 'user-1' } };
      codeRepo.findOne.mockResolvedValue(mockCode);
      const result = await service.findByCode('RUBI-123');
      expect(result.code).toBe('RUBI-123');
    });

    it('should throw NotFoundException if not found', async () => {
      codeRepo.findOne.mockResolvedValue(null);
      await expect(service.findByCode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReferral', () => {
    it('should successfully create a referral', async () => {
      const data = {
        specialistId: 'spec-1',
        patientId: 'patient-1',
        hospitalId: 'hosp-1',
        reason: 'Test reason',
        urgency: UrgencyLevel.NORMAL,
      };
      const result = await service.createReferral(data);
      expect(result.status).toBe(ReferralStatus.SENT);
      expect(referralRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update status of referral', async () => {
      referralRepo.findOne.mockResolvedValue({ id: 'ref-1', status: ReferralStatus.SENT });
      const result = await service.updateStatus('ref-1', ReferralStatus.ACCEPTED);
      expect(result.status).toBe(ReferralStatus.ACCEPTED);
    });
  });
});
