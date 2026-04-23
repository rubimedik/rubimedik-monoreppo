import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { UserRole } from '@repo/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 8 characters)' })
  @IsNotEmpty()
  @MinLength(8)
  password?: string;

  @ApiProperty({ enum: UserRole, isArray: true, example: [UserRole.PATIENT] })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];

  @ApiPropertyOptional({ example: 'REFER-CODE-123', description: 'Optional referral code' })
  @IsOptional()
  @IsString()
  referredBy?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'Google OAuth ID' })
  @IsOptional()
  @IsString()
  googleId?: string;
}
