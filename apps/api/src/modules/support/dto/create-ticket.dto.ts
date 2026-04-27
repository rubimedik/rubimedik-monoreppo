import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { SupportTicketCategory } from '@repo/shared';

export class CreateTicketDto {
  @ApiProperty({ enum: SupportTicketCategory })
  @IsEnum(SupportTicketCategory)
  @IsNotEmpty()
  category: SupportTicketCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  initialMessage: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  consultationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  donationMatchId?: string;
}
