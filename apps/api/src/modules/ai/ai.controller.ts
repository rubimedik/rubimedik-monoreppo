import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SymptomCheckDto } from './dto/symptom-check.dto';
import { MatchSpecialistDto } from './dto/match-specialist.dto';
import { HealthTipsDto } from './dto/health-tips.dto';
import { AiChatDto } from './dto/ai-chat.dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('symptom-check')
  @ApiOperation({ summary: 'Analyze symptoms and get triage recommendation' })
  async checkSymptoms(@Body() symptomCheckDto: SymptomCheckDto) {
    return this.aiService.checkSymptoms(symptomCheckDto.symptoms);
  }

  @Post('match-specialist')
  @ApiOperation({ summary: 'Find the best matching specialists based on symptoms' })
  async matchSpecialist(@Body() matchSpecialistDto: MatchSpecialistDto) {
    return this.aiService.matchSpecialist(matchSpecialistDto.symptoms);
  }

  @Post('health-tips')
  @ApiOperation({ summary: 'Get personalized weekly health tips' })
  async getHealthTips(@Request() req, @Body() healthTipsDto: HealthTipsDto) {
    return this.aiService.getHealthTips(healthTipsDto.profileData || { role: req.user.role });
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with the multilingual AI assistant' })
  async chat(@Request() req, @Body() aiChatDto: AiChatDto) {
    return this.aiService.chat(req.user.userId, aiChatDto.message);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get AI chat history' })
  async getHistory(@Request() req) {
    return this.aiService.getHistory(req.user.userId);
  }
}
