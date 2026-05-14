import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Notification, Prisma } from '@prisma/client';

export type NotificationType = 'new_case' | 'new_message' | 'status_change' | 'delay_alert' | 'delivery_reminder' | 'qc_completed';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId: string;
    notificationType: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data,
    });
  }

  async findByUserId(
    userId: string,
    params?: { skip?: number; take?: number },
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      skip: params?.skip,
      take: params?.take || 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async delete(id: string): Promise<Notification> {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  // Helper methods to create specific notifications
  async notifyNewCase(caseData: { id: string; caseNumber: string; clientName: string }) {
    // Get all admin and operator users
    const users = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'operator'] } },
    });

    await Promise.all(
      users.map((user) =>
        this.create({
          userId: user.id,
          notificationType: 'new_case',
          title: 'Nuovo caso ricevuto',
          message: `Nuovo caso ${caseData.caseNumber} da ${caseData.clientName}`,
          link: `/admin/cases/${caseData.id}`,
        }),
      ),
    );
  }

  async notifyStatusChange(caseData: {
    id: string;
    caseNumber: string;
    newStatus: string;
    clientId: string;
  }) {
    // Notify client users
    const clientUsers = await this.prisma.user.findMany({
      where: { clientId: caseData.clientId },
    });

    await Promise.all(
      clientUsers.map((user) =>
        this.create({
          userId: user.id,
          notificationType: 'status_change',
          title: 'Aggiornamento stato caso',
          message: `Il caso ${caseData.caseNumber} è ora: ${caseData.newStatus}`,
          link: `/portal/cases/${caseData.id}`,
        }),
      ),
    );
  }

  async notifyNewMessage(data: {
    caseId: string;
    caseNumber: string;
    senderName: string;
    recipientIds: string[];
  }) {
    await Promise.all(
      data.recipientIds.map((userId) =>
        this.create({
          userId,
          notificationType: 'new_message',
          title: 'Nuovo messaggio',
          message: `${data.senderName} ha inviato un messaggio per il caso ${data.caseNumber}`,
          link: `/admin/cases/${data.caseId}`,
        }),
      ),
    );
  }
}
