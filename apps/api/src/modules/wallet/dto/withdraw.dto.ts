import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, IsOptional } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({ example: 5000, description: 'Amount to withdraw in NGN' })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ example: '044', description: 'Bank code (e.g., 044 for Access Bank)' })
  @IsString()
  bankCode: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiProperty({ example: '0123456789', description: 'Bank account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'Reason', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
