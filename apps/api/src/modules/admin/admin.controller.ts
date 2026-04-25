import { Controller, Delete, Get, Post, Body, UseGuards, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateConfigDto } from './dto/update-config.dto';
import { SpecialistsService } from '../specialists/specialists.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { AdminService } from './admin.service';
import { UserRole } from '@repo/shared';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  private configOverrides: any = {};

  constructor(
    private configService: ConfigService,
    private specialistsService: SpecialistsService,
    private hospitalsService: HospitalsService,
    private adminService: AdminService,
  ) {}

  
  @Get('referrals')
  @ApiOperation({ summary: 'List all referrals/invites' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getReferrals(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getReferrals(page, limit);
  }

  
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/bulk-delete')
  @ApiOperation({ summary: 'Bulk delete users' })
  async bulkDeleteUsers(@Body('ids') ids: string[]) {
    return this.adminService.bulkDeleteUsers(ids);
  }

  @Delete('consultations/:id')
  @ApiOperation({ summary: 'Delete a consultation' })
  async deleteConsultation(@Param('id') id: string) {
    return this.adminService.deleteConsultation(id);
  }

  @Post('consultations/bulk-delete')
  @ApiOperation({ summary: 'Bulk delete consultations' })
  async bulkDeleteConsultations(@Body('ids') ids: string[]) {
    return this.adminService.bulkDeleteConsultations(ids);
  }

  @Delete('donations/:id')
  @ApiOperation({ summary: 'Delete a donation' })
  async deleteDonation(@Param('id') id: string) {
    return this.adminService.deleteDonation(id);
  }

  @Post('donations/bulk-delete')
  @ApiOperation({ summary: 'Bulk delete donations' })
  async bulkDeleteDonations(@Body('ids') ids: string[]) {
    return this.adminService.bulkDeleteDonations(ids);
  }

  
  @Delete('referrals/:id')
  @ApiOperation({ summary: 'Delete a referral link' })
  async deleteReferral(@Param('id') id: string) {
    return this.adminService.deleteReferral(id);
  }

  @Post('referrals/bulk-delete')
  @ApiOperation({ summary: 'Bulk delete referral links' })
  async bulkDeleteReferrals(@Body('ids') ids: string[]) {
    return this.adminService.bulkDeleteReferrals(ids);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent system activities' })
  async getRecentActivities() {
    return this.adminService.getRecentActivities();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: UserRole
  ) {
    return this.adminService.getUsers(page, limit, role);
  }

  @Get('consultations')
  @ApiOperation({ summary: 'List all consultations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getConsultations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getConsultations(page, limit);
  }

  @Get('donations')
  @ApiOperation({ summary: 'List all donations/requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDonations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getDonations(page, limit);
  }

  @Get('donation-matches')
  @ApiOperation({ summary: 'List all donation matches (actual donations)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDonationMatches(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getDonationMatches(page, limit);
  }

  @Get('financials/payouts')
  @ApiOperation({ summary: 'List all withdrawal requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listPayouts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getPayouts(page, limit);
  }

  @Get('financials/earnings')
  @ApiOperation({ summary: 'Get platform earnings filtered by period' })
  @ApiQuery({ name: 'period', enum: ['today', '7days', '1month', 'all'] })
  async getEarnings(@Query('period') period: 'today' | '7days' | '1month' | 'all' = 'all') {
    return this.adminService.getEarnings(period);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get platform configuration' })
  async getConfig() {
    return {
      platformFeePercent: this.configOverrides.platformFeePercent || this.configService.get('PLATFORM_FEE_PERCENT') || 20,
      referralPointValue: this.configOverrides.referralPointValue || this.configService.get('REFERRAL_POINT_VALUE') || 500,
      followupWindowDays: this.configOverrides.followupWindowDays || this.configService.get('FOLLOWUP_WINDOW_DAYS') || 30,
      consultationTypes: this.configOverrides.consultationTypes || ['video', 'call', 'in-person'],
      packageNames: this.configOverrides.packageNames || ['Quick Consultation', 'Standard Consultation', 'Premium Consultation'],
    };
  }

  @Post('config')
  @ApiOperation({ summary: 'Update platform configuration' })
  async updateConfig(@Body() updateConfigDto: UpdateConfigDto) {
    this.configOverrides = { ...this.configOverrides, ...updateConfigDto };
    return { message: 'Configuration updated successfully', config: await this.getConfig() };
  }

  @Get('kyc/specialists')
  @ApiOperation({ summary: 'List specialists pending approval' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listPendingSpecialists(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const specialists = await this.specialistsService.findPendingApprovals();
    const total = specialists.length;
    const start = (page - 1) * limit;
    const items = specialists.slice(start, start + limit);
    return {
      items,
      meta: { total, page, lastPage: Math.ceil(total / limit) }
    };
  }

  @Post('kyc/specialists/:id/approve')
  @ApiOperation({ summary: 'Approve a specialist' })
  async approveSpecialist(@Param('id') id: string) {
    return this.specialistsService.approveSpecialist(id);
  }

  @Post('kyc/specialists/:id/reject')
  @ApiOperation({ summary: 'Reject a specialist' })
  async rejectSpecialist(@Param('id') id: string) {
    return this.specialistsService.rejectSpecialist(id);
  }

  @Get('kyc/hospitals')
  @ApiOperation({ summary: 'List hospitals pending approval' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listPendingHospitals(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const hospitals = await this.hospitalsService.findPendingApprovals();
    const total = hospitals.length;
    const start = (page - 1) * limit;
    const items = hospitals.slice(start, start + limit);
    return {
      items,
      meta: { total, page, lastPage: Math.ceil(total / limit) }
    };
  }

  @Post('kyc/hospitals/:id/approve')
  @ApiOperation({ summary: 'Approve a hospital' })
  async approveHospital(@Param('id') id: string) {
    return this.hospitalsService.approveHospital(id);
  }

  @Post('kyc/hospitals/:id/reject')
  @ApiOperation({ summary: 'Reject a hospital' })
  async rejectHospital(@Param('id') id: string) {
    return this.hospitalsService.rejectHospital(id);
  }

  @Get('consultations/:id')
  @ApiOperation({ summary: 'Get full consultation details including dual-party feedback' })
  async getConsultationDetail(@Param('id') id: string) {
    return this.adminService.getConsultationDetail(id);
  }

  @Post('consultations/:id/status')
  @ApiOperation({ summary: 'Manually update consultation status' })
  async updateConsultationStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('note') note?: string
  ) {
    return this.adminService.updateConsultationStatus(id, status, note);
  }

  @Post('consultations/:id/approve-payout')
  @ApiOperation({ summary: 'Manually approve and trigger payout for a consultation' })
  async approvePayout(@Param('id') id: string) {
    return this.adminService.approvePayout(id);
  }

  @Post('consultations/:id/refund')
  @ApiOperation({ summary: 'Manually refund a consultation to the patient' })
  async refundConsultation(
    @Param('id') id: string,
    @Body('note') note: string,
  ) {
    return this.adminService.refundConsultation(id, note);
  }

  @Post('users/:id/verification')
  @ApiOperation({ summary: 'Update user email verification status' })
  async updateUserVerification(
    @Param('id') id: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    return this.adminService.updateUserVerification(id, isVerified);
  }
}
