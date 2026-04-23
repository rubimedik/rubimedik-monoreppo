import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateConfigDto {
  @ApiPropertyOptional({ example: 20, description: 'Platform fee percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFeePercent?: number;

  @ApiPropertyOptional({ example: 500, description: 'Referral point value in NGN' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  referralPointValue?: number;

  @ApiPropertyOptional({ example: 30, description: 'Follow-up window in days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  followupWindowDays?: number;

  @ApiPropertyOptional({ example: ['video', 'call', 'in-person'], isArray: true })
  @IsOptional()
  consultationTypes?: string[];

  @ApiPropertyOptional({ example: ['Quick Consultation', 'Standard Consultation', 'Premium Consultation'], isArray: true })
  @IsOptional()
  packageNames?: string[];
}
