import { Controller, Get, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@ApiTags('Hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all hospitals' })
  @ApiResponse({ status: 200, description: 'List of all registered hospitals' })
  findAll() {
    return this.hospitalsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('inventory')
  @ApiOperation({ summary: 'Get current hospital blood inventory' })
  @ApiResponse({ status: 200, description: 'Inventory list for the logged-in hospital' })
  getInventory(@Request() req) {
    return this.hospitalsService.getInventory(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('inventory')
  @ApiOperation({ summary: 'Update blood inventory' })
  @ApiResponse({ status: 200, description: 'Inventory updated successfully' })
  updateInventory(@Request() req, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.hospitalsService.updateInventory(req.user.userId, updateInventoryDto.bloodType, updateInventoryDto.units);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Update hospital public profile' })
  @ApiResponse({ status: 200, description: 'Hospital profile updated successfully' })
  updateProfile(@Request() req, @Body() updateDto: UpdateHospitalProfileDto) {
    return this.hospitalsService.updateProfile(req.user.userId, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get hospital dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Returns request counts and recent activity summaries' })
  getDashboardStats(@Request() req, @Query('filter') filter?: string) {
    return this.hospitalsService.getDashboardStats(req.user.userId, filter);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('inventory-prediction')
  @ApiOperation({ summary: 'Get AI prediction for blood inventory' })
  getInventoryPrediction(@Request() req, @Query('bloodType') bloodType?: string) {
    return this.hospitalsService.getInventoryPrediction(req.user.userId, bloodType || 'O-');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('activities')
  @ApiOperation({ summary: 'Get comprehensive hospital activity log' })
  @ApiResponse({ status: 200, description: 'List of historical activities' })
  getActivities(@Request() req) {
    return this.hospitalsService.getRecentActivities(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital details by UUID' })
  @ApiResponse({ status: 200, description: 'Hospital and its profile' })
  @ApiResponse({ status: 404, description: 'Hospital not found' })
  findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('accept-terms')
  @ApiOperation({ summary: 'Hospital accepts platform terms and conditions' })
  acceptTerms(@Request() req) {
    return this.hospitalsService.acceptTerms(req.user.userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get hospital info linked to a specific user' })
  @ApiResponse({ status: 200, description: 'Hospital object' })
  findByUserId(@Param('userId') userId: string) {
    return this.hospitalsService.findByUserId(userId);
  }
}
