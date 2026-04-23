import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookConsultationDto } from './dto/book-consultation.dto';

@ApiTags('Consultations')
@Controller('consultations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all consultations (Admin or internal use)' })
  @ApiResponse({ status: 200, description: 'List of all consultations' })
  findAll() {
    return this.consultationsService.findAll();
  }

  
  @Get('appointments')
  @ApiOperation({ summary: 'Get all appointments for the current user' })
  @ApiResponse({ status: 200, description: 'List of user appointments' })
  getAppointments(@Request() req) {
    return this.consultationsService.findMyAppointments(req.user.userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all consultations for the current user (role-aware)' })
  @ApiResponse({ status: 200, description: 'List of user consultations' })
  async findMy(@Request() req) {
      const role = req.user.activeRole?.toLowerCase();
      if (role === 'specialist') {
          return this.consultationsService.findBySpecialistId(req.user.userId);
      }
      return this.consultationsService.findByPatientId(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consultation details by ID' })
  @ApiResponse({ status: 200, description: 'Full consultation record' })
  @ApiResponse({ status: 404, description: 'Consultation not found' })
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all consultations for a specific patient' })
  @ApiResponse({ status: 200, description: 'List of patient consultations' })
  findByPatientId(@Param('patientId') patientId: string) {
    return this.consultationsService.findByPatientId(patientId);
  }

  @Get('specialist/:specialistId')
  @ApiOperation({ summary: 'Get all consultations for a specific specialist' })
  @ApiResponse({ status: 200, description: 'List of specialist consultations' })
  findBySpecialistId(@Param('specialistId') specialistId: string) {
    return this.consultationsService.findBySpecialistId(specialistId);
  }

  @Post('book')
  @ApiOperation({ summary: 'Book a new medical consultation' })
  @ApiResponse({ status: 201, description: 'Consultation booked successfully, escrow created' })
  @ApiResponse({ status: 400, description: 'Insufficient funds or invalid specialist' })
  async book(@Request() req, @Body() bookConsultationDto: BookConsultationDto) {
    return this.consultationsService.bookConsultation(
      req.user.userId, 
      bookConsultationDto.specialistId, 
      bookConsultationDto.totalFee, 
      bookConsultationDto.usePoints,
      bookConsultationDto.symptoms,
      bookConsultationDto.scheduledAt,
      bookConsultationDto.attachments,
    );
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a consultation (Policy-based refund logic)' })
  @ApiResponse({ status: 200, description: 'Consultation cancelled, refund processed if applicable' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.consultationsService.cancelConsultation(id, req.user.userId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Mark consultation as completed and release escrow payout' })
  @ApiResponse({ status: 200, description: 'Consultation completed, funds released to specialist' })
  async complete(@Param('id') id: string) {
    return this.consultationsService.completeConsultation(id);
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: 'Activate a free follow-up session for a completed consultation' })
  @ApiResponse({ status: 201, description: 'Follow-up consultation created' })
  async useFollowUp(@Param('id') id: string) {
    return this.consultationsService.useFollowUp(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/feedback')
  @ApiOperation({ summary: 'Submit feedback for a consultation (Specialist or Patient)' })
  @ApiResponse({ status: 200, description: 'Feedback submitted' })
  async submitFeedback(
    @Request() req,
    @Param('id') id: string,
    @Body() feedbackDto: { rating: number; comment: string }
  ) {
    return this.consultationsService.submitFeedback(id, req.user.userId, feedbackDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/review')
  @ApiOperation({ summary: 'Add a review for a consultation' })
  @ApiResponse({ status: 201, description: 'Review added successfully' })
  async addReview(
    @Request() req,
    @Param('id') id: string,
    @Body() reviewDto: { rating: number; comment: string }
  ) {
    return this.consultationsService.addReview(id, req.user.userId, reviewDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id/meeting-details')
  @ApiOperation({ summary: 'Add meeting link or address for a consultation' })
  @ApiResponse({ status: 200, description: 'Meeting details added' })
  async updateMeetingDetails(
    @Request() req,
    @Param('id') id: string,
    @Body() meetingDto: { meetingLink?: string; meetingAddress?: string }
  ) {
    return this.consultationsService.updateMeetingDetails(id, req.user.userId, meetingDto);
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Specialist confirms an appointment request' })
  @ApiResponse({ status: 200, description: 'Appointment confirmed' })
  async confirm(@Param('id') id: string, @Request() req) {
    return this.consultationsService.confirmConsultation(id, req.user.userId);
  }

  @Put(':id/reschedule')
  @ApiOperation({ summary: 'Specialist reschedules an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  async reschedule(
    @Param('id') id: string, 
    @Request() req, 
    @Body() body: { scheduledAt: string }
  ) {
    return this.consultationsService.rescheduleConsultation(id, req.user.userId, body.scheduledAt);
  }

  @Get(':id/check-in')
  @ApiOperation({ summary: 'Verify availability and check in for a consultation' })
  async checkIn(@Param('id') id: string, @Query('userId') userId: string) {
    return this.consultationsService.checkIn(id, userId);
  }
}
