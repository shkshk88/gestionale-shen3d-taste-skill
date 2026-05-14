import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Dentist, Prisma } from '@prisma/client';

@Injectable()
export class DentistsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.DentistCreateInput): Promise<Dentist> {
    return this.prisma.dentist.create({
      data,
      include: {
        client: true,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.DentistWhereInput;
    orderBy?: Prisma.DentistOrderByWithRelationInput;
  }): Promise<Dentist[]> {
    const { skip, take, where, orderBy } = params || {};
    return this.prisma.dentist.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { name: 'asc' },
      include: {
        client: true,
        _count: {
          select: { cases: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Dentist | null> {
    return this.prisma.dentist.findUnique({
      where: { id },
      include: {
        client: true,
        _count: {
          select: { cases: true },
        },
      },
    });
  }

  async findByClientId(clientId: string): Promise<Dentist[]> {
    return this.prisma.dentist.findMany({
      where: { clientId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.DentistUpdateInput): Promise<Dentist> {
    return this.prisma.dentist.update({
      where: { id },
      data,
      include: {
        client: true,
      },
    });
  }

  async delete(id: string): Promise<Dentist> {
    return this.prisma.dentist.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.DentistWhereInput): Promise<number> {
    return this.prisma.dentist.count({ where });
  }
}
