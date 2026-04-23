import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { SpecialistsModule } from '../specialists/specialists.module';
import { AiChat } from './entities/ai-chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiChat]),
    SpecialistsModule
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
