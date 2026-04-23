import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, Query, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DonationStatus } from '@repo/shared';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { BookDonationDto } from './dto/book-donation.dto';
import { RecordDonationDto } from './dto/record-donation.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { BloodRequest } from './entities/blood-request.entity';
import { DonationMatch } from './entities/donation-match.entity';
import { HospitalFeedback } from './entities/hospital-feedback.entity';

@ApiTags('Donations')
@Controller('donations')
@ApiExtraModels(BloodRequest, DonationMatch, HospitalFeedback)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get('requests')
  @ApiOperation({ summary: 'Get all blood requests' })
  @ApiResponse({ status: 200, description: 'List of all active blood requests', type: [BloodRequest] })
  async findAllRequests() {
    return this.donationsService.findAllRequests();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({ summary: 'Get current donor donation bookings' })
  @ApiResponse({ status: 200, description: 'List of donations for the logged-in donor', type: [DonationMatch] })
  async findMyDonations(@Request() req) {
    return this.donationsService.findDonationsByDonorId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-insights')
  @ApiOperation({ summary: 'Get AI-driven donor insights (rarity, burnout warning)' })
  async getMyInsights(@Request() req) {
    return this.donationsService.getDonorInsights(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('eligibility')
  @ApiOperation({ summary: 'Get donor eligibility status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns donor eligibility based on history',
    schema: {
        type: 'object',
        properties: {
            isEligible: { type: 'boolean' },
            lastDonationType: { type: 'string', nullable: true },
            lastDonationDate: { type: 'string', nullable: true },
            nextEligibleDate: { type: 'string', nullable: true },
            daysRemaining: { type: 'number' }
        }
    }
  })
  async getEligibility(@Request() req) {
    return this.donationsService.getEligibility(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('donor-stats')
  @ApiOperation({ summary: 'Get donor statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cumulative donor stats (units, lives saved)',
    schema: {
        type: 'object',
        properties: {
            donationCount: { type: 'number' },
            unitsDonated: { type: 'number' },
            livesSaved: { type: 'number' },
            points: { type: 'number' },
            lastDonationDate: { type: 'string', nullable: true }
        }
    }
  })
  async getDonorStats(@Request() req) {
    return this.donationsService.getDonorStats(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('hospital/matches')
  @ApiOperation({ summary: 'Get hospital donation matches' })
  @ApiResponse({ status: 200, description: "List of donors matched to this hospital's requests", type: [DonationMatch] })
  async findHospitalMatches(@Request() req) {
    return this.donationsService.findMatchesByHospital(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('matches/:matchId')
  @ApiOperation({ summary: 'Get donation match details' })
  @ApiResponse({ status: 200, description: 'Single donation match details', type: DonationMatch })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async findMatchById(@Param('matchId') matchId: string) {
    return this.donationsService.findMatchById(matchId);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get blood request by id' })
  @ApiResponse({ status: 200, description: 'Single blood request details', type: BloodRequest })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async findRequestById(@Param('id') id: string) {
    return this.donationsService.findRequestById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('requests')
  @ApiOperation({ summary: 'Create a blood request' })
  @ApiResponse({ status: 201, description: 'Blood request created successfully', type: BloodRequest })
  async createRequest(@Request() req, @Body() createBloodRequestDto: CreateBloodRequestDto) {
    return this.donationsService.createRequest(req.user.userId, createBloodRequestDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('requests/:id')
  @ApiOperation({ summary: 'Update a blood request' })
  @ApiResponse({ status: 200, description: 'Blood request updated successfully', type: BloodRequest })
  async updateRequest(
    @Request() req, 
    @Param('id') id: string, 
    @Body() updateBloodRequestDto: Partial<CreateBloodRequestDto>
  ) {
    return this.donationsService.updateRequest(req.user.userId, id, updateBloodRequestDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('requests/:id')
  @ApiOperation({ summary: 'Delete a blood request' })
  @ApiResponse({ status: 200, description: 'Blood request deleted successfully' })
  async deleteRequest(@Request() req, @Param('id') id: string) {
    return this.donationsService.deleteRequest(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('book')
  @ApiOperation({ summary: 'Book a donation for a request' })
  @ApiResponse({ status: 201, description: 'Donation booked successfully', type: DonationMatch })
  async bookDonation(@Request() req, @Body() bookDonationDto: BookDonationDto) {
    return this.donationsService.bookDonation(req.user.userId, bookDonationDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('matches/:matchId')
  @ApiOperation({ summary: 'Cancel a donation booking' })
  @ApiResponse({ status: 200, description: 'Donation booking cancelled' })
  async cancelDonation(@Request() req, @Param('matchId') matchId: string) {
    return this.donationsService.cancelDonation(req.user.userId, matchId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('matches/:matchId/reschedule')
  @ApiOperation({ summary: 'Reschedule a donation booking' })
  @ApiBody({
    schema: {
        type: 'object',
        properties: {
            scheduledDate: { type: 'string', format: 'date-time' }
        }
    }
  })
  @ApiResponse({ status: 200, description: 'Donation booking rescheduled', type: DonationMatch })
  async rescheduleDonation(@Request() req, @Param('matchId') matchId: string, @Body('scheduledDate') scheduledDate: Date) {
    return this.donationsService.rescheduleDonation(req.user.userId, matchId, scheduledDate);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('matches/:matchId/status')
  @ApiOperation({ summary: 'Update donation match status (Accept/Decline)' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', enum: Object.values(DonationStatus) }, declineReason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: DonationMatch })
  async updateMatchStatus(
    @Request() req, 
    @Param('matchId') matchId: string, 
    @Body('status') status: DonationStatus,
    @Body('declineReason') declineReason?: string,
  ) {
    return this.donationsService.updateMatchStatus(req.user.userId, matchId, status, declineReason);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('complete/:matchId')
  @ApiOperation({ summary: 'Record a completed donation' })
  @ApiBody({ schema: { type: 'object', properties: { unitsDonated: { type: 'number' } } } })
  @ApiResponse({ status: 201, description: 'Donation marked as completed', type: DonationMatch })
  async completeDonation(@Request() req, @Param('matchId') matchId: string, @Body('unitsDonated') unitsDonated?: number) {
    return this.donationsService.completeDonation(req.user.userId, matchId, unitsDonated);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('record')
  @ApiOperation({ summary: 'Manually record a donation' })
  @ApiResponse({ status: 201, description: 'Manual donation record created', type: DonationMatch })
  async recordDonation(@Request() req, @Body() recordDonationDto: RecordDonationDto) {
    return this.donationsService.recordDonation(req.user.userId, recordDonationDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback for a hospital' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully', type: HospitalFeedback })
  async submitFeedback(@Request() req, @Body() submitFeedbackDto: SubmitFeedbackDto) {
    return this.donationsService.submitFeedback(req.user.userId, submitFeedbackDto);
  }

  @Get('hospital/:hospitalId/feedbacks')
  @ApiOperation({ summary: 'Get feedbacks for a hospital' })
  @ApiResponse({ status: 200, description: 'List of feedbacks for the hospital', type: [HospitalFeedback] })
  async getFeedbacks(@Param('hospitalId') hospitalId: string) {
    return this.donationsService.getFeedbacks(hospitalId);
  }

  @Get('matches/:matchId/check-in')
  @ApiOperation({ summary: 'Verify availability and check in for a donation' })
  async checkIn(@Param('matchId') matchId: string, @Query('userId') userId: string) {
    return this.donationsService.checkIn(matchId, userId);
  }
}
