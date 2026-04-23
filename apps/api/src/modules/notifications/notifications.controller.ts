import { Controller, Get, Post, Param, UseGuards, Request, Put, Body, Delete, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  async getMyNotifications(@Request() req) {
    return this.notificationsService.getMyNotifications(req.user.userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Post('register-token')
  @ApiOperation({ summary: 'Register device push token' })
  async registerToken(@Request() req, @Body() body: { token: string; platform: string }) {
    return this.notificationsService.registerToken(req.user.userId, body.token, body.platform);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all user notifications' })
  async deleteAll(@Request() req) {
    return this.notificationsService.deleteAll(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific notification' })
  async deleteOne(@Param('id') id: string) {
    return this.notificationsService.deleteOne(id);
  }
}
