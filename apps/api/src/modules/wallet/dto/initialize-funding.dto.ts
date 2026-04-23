import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class InitializeFundingDto {
  @ApiProperty({ example: 1000, description: 'Amount to fund in NGN' })
  @IsNumber()
  @Min(100)
  amount: number;
}
