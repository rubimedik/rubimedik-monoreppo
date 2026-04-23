import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AiChatDto {
  @ApiProperty({ example: 'How can I prevent malaria?', description: 'User message to AI assistant' })
  @IsNotEmpty()
  @IsString()
  message: string;
}
