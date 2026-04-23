import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'receiver@example.com', description: 'Email of the receiver' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 500, description: 'Amount to transfer in NGN' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'For lunch', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
