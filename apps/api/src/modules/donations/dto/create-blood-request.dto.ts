import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { UrgencyLevel, DonationType } from '@repo/shared';

export class CreateBloodRequestDto {
  @ApiProperty({ example: "Urgent Blood Needed", description: "Title of the request", required: true })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'O+', description: 'Blood type needed' })
  @IsNotEmpty()
  @IsString()
  bloodType: string;

  @ApiProperty({ example: 3, description: 'Number of units needed' })
  @IsNumber()
  @Min(1)
  units: number;

  @ApiProperty({ enum: UrgencyLevel, example: UrgencyLevel.URGENT })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;

  @ApiProperty({ example: 'Patient in critical condition needs surgery', description: 'Reason for request' })
  @IsString()
  reason: string;

  @ApiProperty({ enum: DonationType, example: DonationType.WHOLE_BLOOD, required: true })
  @IsEnum(DonationType)
  @IsNotEmpty()
  donationType: DonationType;

}
