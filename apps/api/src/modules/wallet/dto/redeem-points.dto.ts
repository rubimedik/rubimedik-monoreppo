import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class RedeemPointsDto {
  @ApiProperty({ example: 10, description: 'Number of referral points to redeem' })
  @IsNumber()
  @Min(1)
  points: number;
}
