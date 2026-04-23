import { Controller, Get, Post, Body, Param, UseGuards, Request, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SpecialistsService } from './specialists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConsultationPackageDto } from './dto/create-consultation-package.dto';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto';

@ApiTags('Specialists')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all specialists' })
  @ApiResponse({ status: 200, description: 'List of all medical specialists' })
  findAll() {
    return this.specialistsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('profile')
  @ApiOperation({ summary: 'Update specialist public profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(@Request() req, @Body() updateDto: UpdateSpecialistProfileDto) {
    return this.specialistsService.updateProfile(req.user.userId, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get specialist dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Returns earnings and consultation summaries' })
  getDashboardStats(@Request() req) {
    return this.specialistsService.getDashboardStats(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('activities')
  @ApiOperation({ summary: 'Get comprehensive specialist activity log' })
  @ApiResponse({ status: 200, description: 'List of historical activities' })
  getActivities(@Request() req) {
    return this.specialistsService.getRecentActivities(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('packages')
  @ApiOperation({ summary: 'Add a new consultation package' })
  @ApiResponse({ status: 201, description: 'Package added successfully' })
  addPackage(@Request() req, @Body() packageDto: CreateConsultationPackageDto) {
    return this.specialistsService.addPackage(req.user.userId, packageDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specialist details by UUID' })
  @ApiResponse({ status: 200, description: 'Specialist and its profile' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  findOne(@Param('id') id: string) {
    return this.specialistsService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get specialist info linked to a specific user' })
  @ApiResponse({ status: 200, description: 'Specialist object' })
  findByUserId(@Param('userId') userId: string) {
    return this.specialistsService.findByUserId(userId);
  }
}
