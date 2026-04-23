import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@repo/shared';

export class GoogleLoginDto {
  @ApiProperty({ example: 'google-id-token-xyz', description: 'The ID Token received from Google' })
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.PATIENT, description: 'Required for new accounts' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
