import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Client, Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ClientCreateInput): Promise<Client> {
    return this.prisma.client.create({
      data,
      include: {
        priceList: true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ClientWhereInput;
    orderBy?: Prisma.ClientOrderByWithRelationInput;
  }): Promise<Client[]> {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.client.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        priceList: true,
        _count: {
          select: { cases: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        priceList: true,
        users: true,
        _count: {
          select: { cases: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        priceList: true,
      },
    });
  }

  async delete(id: string): Promise<Client> {
    return this.prisma.client.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.ClientWhereInput): Promise<number> {
    return this.prisma.client.count({ where });
  }
}
