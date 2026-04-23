import { Controller, Get, Post, Param, Query, UseGuards, Request, Body, Version, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageType } from '@repo/shared';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Version('1')
  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for the current user' })
  getMyRooms(@Request() req) {
    return this.chatService.findUserRooms(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Version('1')
  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread messages count for current user' })
  getTotalUnread(@Request() req) {
    return this.chatService.getTotalUnread(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Version('1')
  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get chat room by id' })
  findRoom(@Request() req, @Param('id') id: string) {
    return this.chatService.findRoom(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Version('1')
  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get messages in a room (paginated, 90-day retention)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(id, page ? Number(page) : 1, limit ? Number(limit) : 50);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Version('1')
  @Post('rooms/:id/messages')
  @ApiOperation({ summary: 'Send a message in a room' })
  sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { 
      content: string, 
      type?: MessageType, 
      replyToId?: string,
      fileUrl?: string,
      fileName?: string,
      fileSize?: number,
      mimeType?: string
    },
  ) {
    return this.chatService.saveMessage(id, req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Version('1')
  @Patch('rooms/:id/read')
  @ApiOperation({ summary: 'Mark all messages in a room as read' })
  markAsRead(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.chatService.markRoomAsRead(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Version('1')
  @Post('messages/:id/reactions')
  @ApiOperation({ summary: 'Toggle an emoji reaction on a message' })
  toggleReaction(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { emoji: string },
  ) {
    return this.chatService.toggleReaction(id, req.user.userId, body.emoji);
  }
}
