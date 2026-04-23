import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class BookConsultationDto {
  @ApiProperty({ example: 'specialist-id-123', description: 'ID of the specialist' })
  @IsNotEmpty()
  @IsString()
  specialistId: string;

  @ApiProperty({ example: 10000, description: 'Total fee for the consultation' })
  @IsNumber()
  @Min(0)
  totalFee: number;

  @ApiPropertyOptional({ example: false, description: 'Whether to use referral points for payment' })
  @IsOptional()
  @IsBoolean()
  usePoints?: boolean;

  @ApiPropertyOptional({ example: 'I have a headache', description: 'Patient symptoms or notes' })
  @IsOptional()
  @IsString()
  symptoms?: string;

  @ApiPropertyOptional({ example: ['url1', 'url2'], description: 'Attached medical documents or images' })
  @IsOptional()
  attachments?: string[];

  @ApiProperty({ example: '2026-05-01T10:00:00Z', description: 'Scheduled date and time' })
  @IsNotEmpty()
  @IsString()
  scheduledAt: string;
}
