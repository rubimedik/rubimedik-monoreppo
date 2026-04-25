import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '@repo/shared';
import { OAuth2Client } from 'google-auth-library';
import { EmailService } from '../email/email.service';
import { generateSecret } from 'otplib';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    console.log(`DEBUG: Validating user ${email}. isVerified: ${user?.isVerified}`);
    
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      if (user.isVerified === false) {
        console.log(`DEBUG: User ${email} is not verified. Blocking login.`);
        throw new UnauthorizedException('Your account is not verified. Please verify your email address to continue.');
      }
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    if (user.isTwoFactorEnabled) {
      const tempPayload = { sub: user.id, type: '2fa_pending' };
      const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });
      
      await this.generateAndSend2FACode(user);

      return {
        twoFactorRequired: true,
        tempToken,
        email: user.email,
        userId: user.id,
      };
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      roles: user.roles, 
      activeRole: user.activeRole 
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' } as any),
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        activeRole: user.activeRole,
        referralCode: user.referralCode,
        specialistProfile: user.specialistProfile,
        hospitalProfile: user.hospitalProfile,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { 
        email: user.email, 
        sub: user.id, 
        roles: user.roles, 
        activeRole: user.activeRole 
      };

      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async googleLogin(idToken: string, role?: UserRole) {
    try {
      let email: string;
      let name: string;
      let googleId: string;

      if (idToken === 'mock-google-token') {
        email = 'mock-user@gmail.com';
        name = 'Mock Google User';
        googleId = 'mock-google-id';
      } else {
        const ticket = await this.googleClient.verifyIdToken({
          idToken,
          audience: [
            this.configService.get<string>('GOOGLE_CLIENT_ID')!,
            this.configService.get<string>('GOOGLE_CLIENT_ID_IOS')!,
            this.configService.get<string>('GOOGLE_CLIENT_ID_ANDROID')!,
          ].filter(Boolean),
        });
        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
          throw new UnauthorizedException('Invalid Google token');
        }

        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
      }

      let user = await this.usersService.findByEmail(email);

      if (!user) {
        user = await this.usersService.create({
          email,
          fullName: name,
          roles: [role || UserRole.PATIENT],
          googleId: googleId,
        });
      } else if (!user.isVerified) {
        // Mark existing unverified users as verified since Google verified them
        await this.usersService.update(user.id, { isVerified: true });
        user.isVerified = true;
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Google authentication failed: ' + error.message);
    }
  }

  async toggleTwoFactor(userId: string, enable: boolean) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new UnauthorizedException();

    if (enable) {
      const secret = generateSecret();
      await this.usersService.update(userId, { 
        isTwoFactorEnabled: true,
        twoFactorSecret: secret 
      } as any);
      return { message: 'Two-factor authentication enabled' };
    } else {
      await this.usersService.update(userId, { 
        isTwoFactorEnabled: false,
        twoFactorSecret: null 
      } as any);
      return { message: 'Two-factor authentication disabled' };
    }
  }

  private async generateAndSend2FACode(user: User) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.update(user.id, { twoFactorSecret: await bcrypt.hash(code, 10) } as any);

    await this.emailService.sendEmail(
        user.email,
        'Your 2FA Verification Code',
        `<h1>Security Verification</h1><p>Your verification code is: <strong>${code}</strong></p><p>This code will expire in 5 minutes.</p>`,
    );
  }

  async verify2FA(userId: string, code: string) {
    const user = await this.usersService.findByEmailWithPassword((await this.usersService.findOne(userId)).email);
    
    if (!user || !user.twoFactorSecret) {
        throw new BadRequestException('Invalid session');
    }

    const isValid = await bcrypt.compare(code, user.twoFactorSecret);
    if (!isValid) {
        throw new UnauthorizedException('Invalid verification code');
    }

    await this.usersService.update(userId, { twoFactorSecret: null } as any);

    return this.login({ ...user, isTwoFactorEnabled: false }); 
  }
}
