import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaseMessage, Prisma } from '@prisma/client';

export type MessageType = 'text' | 'file' | 'annotation';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: {
    caseId: string;
    senderId: string;
    messageText: string;
    messageType?: MessageType;
    fileId?: string;
    annotationData?: any;
  }): Promise<CaseMessage> {
    const message = await this.prisma.caseMessage.create({
      data: {
        caseId: data.caseId,
        senderId: data.senderId,
        messageText: data.messageText,
        messageType: data.messageType || 'text',
        fileId: data.fileId,
        annotationData: data.annotationData ? JSON.stringify(data.annotationData) : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            language: true,
          },
        },
        file: true,
      },
    });

    // Add to case timeline
    await this.prisma.caseTimeline.create({
      data: {
        caseId: data.caseId,
        eventType: 'message_sent',
        eventData: JSON.stringify({ messageId: message.id }),
        userId: data.senderId,
      },
    });

    return message;
  }

  async getMessagesByCaseId(caseId: string): Promise<CaseMessage[]> {
    return this.prisma.caseMessage.findMany({
      where: { caseId },
      include: {
        sender: true,
        file: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsRead(messageId: string): Promise<CaseMessage> {
    return this.prisma.caseMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(caseId: string, userId: string): Promise<void> {
    await this.prisma.caseMessage.updateMany({
      where: {
        caseId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Get user's client ID if they are a client
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });

    if (!user) return 0;

    // Build where clause based on user role
    const where: Prisma.CaseMessageWhereInput = {
      isRead: false,
      senderId: { not: userId },
    };

    if (user.role === 'client' && user.clientId) {
      where.case = { clientId: user.clientId };
    }

    return this.prisma.caseMessage.count({ where });
  }
}
