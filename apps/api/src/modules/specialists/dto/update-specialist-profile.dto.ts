import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateSpecialistProfileDto {
  @ApiPropertyOptional({ example: 'Cardiology', description: 'Specialist specialty' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: 'MD-123456', description: 'Medical license number' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: { mon: '09:00-17:00' }, description: 'Availability slots configuration' })
  @IsOptional()
  @IsObject()
  availabilitySlots?: any;

  @ApiPropertyOptional({ example: 'https://storage.com/cert.pdf', description: 'Practice certification document URL' })
  @IsOptional()
  @IsString()
  certificationUrl?: string;

  @ApiPropertyOptional({ example: 'A brief bio about the specialist', description: 'Specialist bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'Access Bank', description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '058', description: 'Bank code' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ example: '0123456789', description: 'Account number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Dr. John Doe', description: 'Account name' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ example: '+2348000000000', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 5, description: 'Years of medical experience' })
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria', description: 'Practice location or address' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: [{ name: 'Basic', price: 10000, type: 'Quick Consultation', duration: '15 mins', benefits: ['Video call', 'Chat'] }], isArray: true })
  @IsOptional()
  consultationPackages?: any[];
}
