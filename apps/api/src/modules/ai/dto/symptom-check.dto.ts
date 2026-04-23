import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SymptomCheckDto {
  @ApiProperty({ example: 'I have a sharp pain in my lower back for 2 days', description: 'Description of symptoms' })
  @IsNotEmpty()
  @IsString()
  symptoms: string;
}
