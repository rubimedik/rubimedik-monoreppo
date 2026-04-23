import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReferralStatus } from '@repo/shared';

export class UpdateReferralStatusDto {
  @ApiProperty({ enum: ReferralStatus, example: ReferralStatus.ACCEPTED })
  @IsEnum(ReferralStatus)
  @IsNotEmpty()
  status: ReferralStatus;
}
