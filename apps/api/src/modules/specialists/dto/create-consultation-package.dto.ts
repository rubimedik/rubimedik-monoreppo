import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateConsultationPackageDto {
  @ApiProperty({ example: 'Standard Consultation', description: 'Name of the package' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 10000, description: 'Price in NGN' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsNumber()
  @Min(15)
  duration: number;

  @ApiPropertyOptional({ example: 1, description: 'Number of free follow-ups' })
  @IsOptional()
  @IsNumber()
  followUps?: number;
}
