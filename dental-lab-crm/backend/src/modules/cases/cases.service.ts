import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Case, Prisma } from '@prisma/client';

export type CaseStatus = 'received' | 'in_progress' | 'qc' | 'shipped' | 'delivered';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CaseCreateInput): Promise<Case> {
    return this.prisma.case.create({
      data,
      include: {
        client: true,
        teeth: true,
        files: true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CaseWhereInput;
    orderBy?: Prisma.CaseOrderByWithRelationInput;
  }): Promise<Case[]> {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.case.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        client: true,
        teeth: true,
        files: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Case | null> {
    return this.prisma.case.findUnique({
      where: { id },
      include: {
        client: true,
        teeth: true,
        files: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' },
        },
        messages: {
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
          orderBy: { createdAt: 'asc' },
        },
        timeline: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByCaseNumber(caseNumber: string): Promise<Case | null> {
    return this.prisma.case.findUnique({
      where: { caseNumber },
      include: {
        client: true,
        teeth: true,
        files: true,
      },
    });
  }

  async update(id: string, data: Prisma.CaseUpdateInput): Promise<Case> {
    return this.prisma.case.update({
      where: { id },
      data,
      include: {
        client: true,
        teeth: true,
        files: true,
      },
    });
  }

  async updateStatus(id: string, status: CaseStatus, userId?: string): Promise<Case> {
    // First verify the case exists
    const existingCase = await this.prisma.case.findUnique({
      where: { id },
    });

    if (!existingCase) {
      throw new Error(`Case with id ${id} not found`);
    }

    // Update with timeline only if userId is provided
    const updateData: any = {
      status,
      shippedDate: status === 'shipped' ? new Date() : undefined,
    };

    // Only create timeline if userId is provided
    if (userId) {
      updateData.timeline = {
        create: {
          eventType: 'status_changed',
          eventData: JSON.stringify({ newStatus: status }),
          userId,
        },
      };
    }

    const result = await this.prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        teeth: true,
      },
    });
    return result;
  }

  async delete(id: string): Promise<Case> {
    return this.prisma.case.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.CaseWhereInput): Promise<number> {
    return this.prisma.case.count({ where });
  }

  async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LAB-${year}-`;

    // Get all case numbers for this year
    const existingCases = await this.prisma.case.findMany({
      where: {
        caseNumber: {
          startsWith: prefix,
        },
      },
      select: {
        caseNumber: true,
      },
      orderBy: {
        caseNumber: 'desc',
      },
      take: 1,
    });

    let nextNumber = 1;

    if (existingCases.length > 0) {
      // Extract the number from the last case number (e.g., "LAB-2026-0003" -> 3)
      const lastCaseNumber = existingCases[0].caseNumber;
      const lastNumber = parseInt(lastCaseNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  async getStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayDeliveries, inProgress, inQC, received] = await Promise.all([
      this.prisma.case.count({
        where: {
          dueDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
          status: { not: 'shipped' },
        },
      }),
      this.prisma.case.count({ where: { status: 'in_progress' } }),
      this.prisma.case.count({ where: { status: 'qc' } }),
      this.prisma.case.count({ where: { status: 'received' } }),
    ]);

    return { todayDeliveries, inProgress, inQC, received };
  }
}
