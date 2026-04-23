import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateInventoryDto {
  @ApiProperty({ example: 'O+' })
  @IsNotEmpty()
  @IsString()
  bloodType: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  units: number;
}
