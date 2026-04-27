import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {
    this.chatService.messageEmitter.subscribe(({ roomId, message }) => {
      if (this.server) {
        this.server.to(roomId).emit('newMessage', message);
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // In a real app, you would extract and verify JWT from client.handshake.auth.token
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
  ) {
    client.join(roomId);
    console.log(`Client ${client.id} joined room: ${roomId}`);
    return { event: 'joinedRoom', roomId };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: string,
  ) {
    client.leave(roomId);
    console.log(`Client ${client.id} left room: ${roomId}`);
    return { event: 'leftRoom', roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string; content: string },
  ) {
    const { roomId, userId, content } = payload;
    
    // Save to database
    const savedMessage = await this.chatService.saveMessage(roomId, userId, { content });
    
    // Broadcast to room
    this.server.to(roomId).emit('newMessage', savedMessage);
    
    return savedMessage;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; userId: string; isTyping: boolean },
  ) {
    // Broadcast typing status to room (except sender)
    client.to(payload.roomId).emit('userTyping', payload);
  }
}
