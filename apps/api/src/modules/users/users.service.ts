import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { ReferralCode } from '../referrals/entities/referral-code.entity';
import { SpecialistProfile } from '../specialists/entities/specialist-profile.entity';
import { HospitalProfile } from '../hospitals/entities/hospital-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@repo/shared';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis,
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, roles, referredBy, firstName, lastName } = createUserDto;
    console.log(`DEBUG: Starting signup for ${email}. Roles: ${roles}`);

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      console.log(`DEBUG: User ${email} already exists`);
      throw new ConflictException('User already exists');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log(`DEBUG: Creating user entity`);
      const user = new User();
      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      user.fullName = createUserDto.fullName;
      user.googleId = createUserDto.googleId;
      
      if (password) {
        console.log(`DEBUG: Hashing password`);
        user.password = await bcrypt.hash(password, 10);
      }
      user.roles = roles || [UserRole.PATIENT];
      user.activeRole = user.roles[0];
      user.referralCode = await this.generateUniqueReferralCode();
      
      // Google users are automatically verified
      user.isVerified = !!createUserDto.googleId;

      // Handle referral code lookup
      if (referredBy) {
        console.log(`DEBUG: Looking up referrer ${referredBy}`);
        const referrer = await this.usersRepository.findOne({ where: { referralCode: referredBy } });
        if (referrer) {
          user.referredById = referrer.id;
          console.log(`DEBUG: Referrer found: ${referrer.id}`);
        }
      }

      console.log(`DEBUG: Saving user`);
      const savedUser = await queryRunner.manager.save(user);

      console.log(`DEBUG: Creating wallet`);
      const wallet = new Wallet();
      wallet.user = savedUser;
      await queryRunner.manager.save(wallet);

      console.log("DEBUG: Creating patient profile");
      const patientProfile = new PatientProfile();
      patientProfile.user = savedUser;
      await queryRunner.manager.save(patientProfile);

      console.log(`DEBUG: Creating referral code entry`);
      const rc = new ReferralCode();
      rc.code = user.referralCode;
      rc.user = savedUser;
      await queryRunner.manager.save(rc);

      // Create Profiles for the assigned roles
      if (user.roles.includes(UserRole.SPECIALIST)) {
        console.log(`DEBUG: Creating specialist profile`);
        const specProfile = new SpecialistProfile();
        specProfile.user = savedUser;
        specProfile.specialty = 'General Practitioner';
        specProfile.licenseNumber = 'Pending...';
        await queryRunner.manager.save(specProfile);
      }
      
      if (user.roles.includes(UserRole.HOSPITAL)) {
        console.log(`DEBUG: Creating hospital profile`);
        const hospProfile = new HospitalProfile();
        hospProfile.user = savedUser;
        hospProfile.hospitalName = 'New Hospital';
        await queryRunner.manager.save(hospProfile);
      }

      if (!user.isVerified) {
        console.log(`DEBUG: Setting OTP in redis`);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        try {
          await this.redis.set(`otp:${email}`, otp, 'EX', 600);
        } catch (redisError) {
          console.error('DEBUG: Redis failure during signup', redisError);
        }
        
        try {
          console.log(`DEBUG: Sending OTP email`);
          const name = user.fullName || user.firstName || this.emailService.extractName(email);
          await this.emailService.sendOTP(email, otp, name);
        } catch (emailError) {
          console.error('DEBUG: Failed to send verification email', emailError);
        }
      } else {
        // Send welcome email to users who are already verified (e.g. Google Signup)
        try {
          const name = user.fullName || user.firstName || this.emailService.extractName(email);
          await this.emailService.sendWelcomeEmail(email, name);
        } catch (emailError) {
          console.error('DEBUG: Failed to send welcome email', emailError);
        }
      }

      await queryRunner.commitTransaction();
      console.log(`DEBUG: Signup successful for ${email}`);
      return savedUser;
    } catch (err) {
      console.error('CRITICAL: Signup transaction failed', err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const cachedOtp = await this.redis.get(`otp:${email}`);
    if (!cachedOtp || cachedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    user.isVerified = true;
    await this.usersRepository.save(user);
    await this.redis.del(`otp:${email}`);

    return true;
  }

  async resendOTP(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${email}`, otp, 'EX', 600);
    const name = user.fullName || (user as any).hospitalProfile?.hospitalName;
    await this.emailService.sendOTP(email, otp, name);
  }

  async switchRole(userId: string, newRole: UserRole): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!user.roles.includes(newRole)) {
      throw new BadRequestException(`User does not have the role: ${newRole}`);
    }

    user.activeRole = newRole;
    return this.usersRepository.save(user);
  }

  async addRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!user.roles.includes(role)) {
      user.roles.push(role);
      
      // Auto-create profile mappings so they show in Pending Approvals
      if (role === UserRole.SPECIALIST) {
        const specProfile = new SpecialistProfile();
        specProfile.user = user;
        specProfile.specialty = 'General Practitioner';
        specProfile.licenseNumber = 'Pending...';
        await this.dataSource.getRepository(SpecialistProfile).save(specProfile);
      }

      if (role === UserRole.HOSPITAL) {
        const hospProfile = new HospitalProfile();
        hospProfile.user = user;
        hospProfile.hospitalName = 'New Hospital';
        await this.dataSource.getRepository(HospitalProfile).save(hospProfile);
      }
    }
    
    user.activeRole = role; // Automatically switch to the new role
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['wallet', 'specialistProfile', 'hospitalProfile', 'patientProfile'] });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email }, relations: ['wallet'] });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['wallet'],
      select: ['id', 'email', 'password', 'roles', 'activeRole', 'googleId', 'isVerified', 'referralCode'],
    });
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['wallet', 'specialistProfile', 'hospitalProfile', 'patientProfile']
    });

    if (user && !user.referralCode) {
      user.referralCode = await this.generateUniqueReferralCode();
      await this.usersRepository.save(user);
    }

    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    console.log(`DEBUG: Updating user profile for ID: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      console.error(`DEBUG: User with ID ${id} not found during update`);
      throw new NotFoundException('User profile not found');
    }

    const { fullName, phoneNumber, bloodGroup, bloodType, genotype, avatarUrl, isVerified, activeRole, donationGoal, isTwoFactorEnabled, twoFactorSecret, bankName, bankCode, accountNumber, accountName, ...profileData } = data as any;
    const finalBloodGroup = bloodGroup || bloodType;

    // Update basic user info
    try {
        await this.usersRepository.update(id, { 
          fullName, 
          phoneNumber, 
          bloodGroup: finalBloodGroup, 
          genotype, 
          avatarUrl, 
          isVerified, 
          activeRole, 
          donationGoal, 
          isTwoFactorEnabled, 
          twoFactorSecret,
          bankName,
          bankCode,
          accountNumber,
          accountName
        });
    } catch (error) {
        this.logger.error(`Failed to update user ${id}: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Could not update user profile. Database error.');
    }
    // Update patient profile if health or location data is provided
    const profileFields = ['healthCondition', 'medicalNotes', 'address', 'city', 'state', 'latitude', 'longitude'];
    const hasProfileUpdate = profileFields.some(field => profileData[field] !== undefined);

    if (hasProfileUpdate) {
        let profile = await this.dataSource.getRepository(PatientProfile).findOne({ where: { user: { id } } });
        if (!profile) {
            profile = this.dataSource.getRepository(PatientProfile).create({ user: { id } as any });
        }
        
        profileFields.forEach(field => {
            if (profileData[field] !== undefined) {
                profile[field] = profileData[field];
            }
        });
        
        await this.dataSource.getRepository(PatientProfile).save(profile);
    }

    return this.findOne(id);
  }

  private async generateUniqueReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = 'RUBI-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existingCode = await this.usersRepository.findOne({ where: { referralCode: code } });
      if (!existingCode) {
        isUnique = true;
      }
    }

    return code;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) return; // Silent return for security

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`reset-otp:${email}`, otp, 'EX', 1800); // 30 minutes
    const name = user.fullName || (user as any).hospitalProfile?.hospitalName;
    await this.emailService.sendOTP(email, otp, name);
  }

  async resetPassword(email: string, otp: string, newPass: string): Promise<void> {
    const cachedOtp = await this.redis.get(`reset-otp:${email}`);
    if (!cachedOtp || cachedOtp !== otp) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const user = await this.findByEmailWithPassword(email);
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(newPass, 10);
    await this.usersRepository.save(user);
    await this.redis.del(`reset-otp:${email}`);
  }
}
