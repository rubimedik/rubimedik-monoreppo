import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UrgencyLevel } from '@repo/shared';

export class CreateReferralDto {
  @ApiProperty({ example: 'patient-id-123', description: 'ID of the patient being referred' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiProperty({ example: 'hospital-id-456', description: 'ID of the destination hospital' })
  @IsNotEmpty()
  @IsString()
  hospitalId: string;

  @ApiProperty({ example: 'Patient needs advanced cardiac testing', description: 'Reason for referral' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ enum: UrgencyLevel, example: UrgencyLevel.NORMAL })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;
}
