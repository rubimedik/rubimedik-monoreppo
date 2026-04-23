import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitFeedbackDto {
  @ApiProperty({ example: 'uuid-of-hospital' })
  @IsNotEmpty()
  @IsString()
  hospitalId: string;

  @ApiPropertyOptional({ example: 'uuid-of-request' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Excellent service and friendly staff.' })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
