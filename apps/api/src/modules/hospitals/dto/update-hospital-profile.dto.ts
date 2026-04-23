import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateHospitalProfileDto {
  @ApiPropertyOptional({ example: 'St. Mary\'s General Hospital', description: 'Hospital full name' })
  @IsOptional()
  @IsString()
  hospitalName?: string;

  @ApiPropertyOptional({ example: '123 Health St, Lagos', description: 'Hospital address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'HOSP-123456', description: 'Official License Number' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'URL of the uploaded registration document' })
  @IsOptional()
  @IsString()
  documentUrl?: string;
  
  @ApiPropertyOptional({ example: '+2348012345678', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
