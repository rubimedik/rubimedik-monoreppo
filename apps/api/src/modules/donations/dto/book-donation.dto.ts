import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BookDonationDto {
  @ApiProperty({ example: 'uuid-of-request' })
  @IsNotEmpty()
  @IsString()
  requestId: string;

  @ApiPropertyOptional({ example: '2026-05-20T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
