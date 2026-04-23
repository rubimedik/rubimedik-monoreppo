import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DonationType, UrgencyLevel } from '@repo/shared';

export class RecordDonationDto {
  @ApiProperty({ example: 'donor@example.com' })
  @IsNotEmpty()
  @IsString()
  donorEmail: string;

  @ApiProperty({ example: 'O+' })
  @IsNotEmpty()
  @IsString()
  bloodType: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  units: number;

  @ApiProperty({ example: '2026-04-17T20:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  donationDate: string;

  @ApiPropertyOptional({ example: 'uuid-of-request' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-match' })
  @IsOptional()
  @IsString()
  matchId?: string;

  @ApiProperty({ enum: DonationType, example: DonationType.WHOLE_BLOOD })
  @IsEnum(DonationType)
  @IsNotEmpty()
  donationType: DonationType;

  @ApiPropertyOptional({ example: 'Post-surgery recovery' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @ApiPropertyOptional({ example: 'Emergency Blood Drive' })
  @IsOptional()
  @IsString()
  title?: string;
}
