import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);
      console.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, sockets);
      }
      console.log(`User ${userId} disconnected from socket ${client.id}`);
    }
  }

  @SubscribeMessage('joinCase')
  async handleJoinCase(
    @ConnectedSocket() client: Socket,
    @MessageBody() caseId: string,
  ) {
    client.join(`case:${caseId}`);
    console.log(`Socket ${client.id} joined case:${caseId}`);
  }

  @SubscribeMessage('leaveCase')
  async handleLeaveCase(
    @ConnectedSocket() client: Socket,
    @MessageBody() caseId: string,
  ) {
    client.leave(`case:${caseId}`);
    console.log(`Socket ${client.id} left case:${caseId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { caseId: string; senderId: string; messageText: string; fileId?: string },
  ) {
    try {
      const message = await this.chatService.createMessage({
        caseId: data.caseId,
        senderId: data.senderId,
        messageText: data.messageText,
        fileId: data.fileId,
      });

      // Broadcast to all users in the case room (including sender)
      this.server.to(`case:${data.caseId}`).emit('newMessage', message);

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      client.emit('messageError', { error: 'Failed to send message' });
      return null;
    }
  }

  // Emit to specific users
  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // Emit notification for new case
  emitNewCase(caseData: any) {
    this.server.emit('newCase', caseData);
  }

  // Emit status change
  emitStatusChange(caseId: string, newStatus: string) {
    this.server.to(`case:${caseId}`).emit('statusChanged', { caseId, newStatus });
  }
}
