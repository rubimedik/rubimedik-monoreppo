import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class HealthTipsDto {
  @ApiPropertyOptional({ example: { age: 30, gender: 'MALE' }, description: 'Optional user profile data' })
  @IsOptional()
  profileData?: any;
}
