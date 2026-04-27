import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/shared';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  create(@Request() req, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-tickets')
  @ApiOperation({ summary: 'Get all support tickets for the current user' })
  getMyTickets(@Request() req) {
    return this.supportService.getMyTickets(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('tickets')
  @ApiOperation({ summary: 'Get all support tickets (Admin only)' })
  findAll() {
    return this.supportService.getAllTickets();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get support ticket details' })
  findOne(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update support ticket (Admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateTicket(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('tickets/:id/resolve')
  @ApiOperation({ summary: 'Mark support ticket as resolved (User)' })
  resolve(@Param('id') id: string, @Request() req) {
    return this.supportService.resolveTicket(id, req.user.userId);
  }
}
