import { Controller, Get, Post, Put, Param, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralStatusDto } from './dto/update-referral-status.dto';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('code/:code')
  @ApiOperation({ summary: 'Get referral info by code' })
  findByCode(@Param('code') code: string) {
    return this.referralsService.findByCode(code);
  }

  
  
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get referral leaderboard' })
  getLeaderboard() {
    return this.referralsService.getLeaderboard();
  }

  @Get('invites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users I have invited' })
  getInvitedUsers(@Request() req) {
    return this.referralsService.getInvitedUsers(req.user.userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my referrals' })
  getMyReferrals(@Request() req) {
    return this.referralsService.getMyReferrals(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a referral (Specialist only)' })
  async create(@Request() req, @Body() createReferralDto: CreateReferralDto) {
    return this.referralsService.createReferral({
      specialistId: req.user.userId,
      ...createReferralDto
    });
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update referral status' })
  async updateStatus(@Param('id') id: string, @Body() updateReferralStatusDto: UpdateReferralStatusDto) {
    return this.referralsService.updateStatus(id, updateReferralStatusDto.status);
  }
}
