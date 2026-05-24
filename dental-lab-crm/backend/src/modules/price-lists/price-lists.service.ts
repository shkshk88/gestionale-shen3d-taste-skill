import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceList, PriceListItem, Prisma } from '@prisma/client';

export type WorkType = 'corona' | 'protesi' | 'impianto' | 'bite' | 'maryland' | 'intarsio' | 'faccetta' | 'altro';
export type Material = 'ZR' | 'EMAX' | 'PMMA' | 'RES' | 'CR_CO' | 'CERAM' | 'COMP' | 'ALT';

@Injectable()
export class PriceListsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    listName: string;
    description?: string;
    isDefault?: boolean;
    items?: { workType: WorkType; material: Material; unitPrice: number }[];
  }): Promise<PriceList> {
    if (data.isDefault) {
      await this.prisma.priceList.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.priceList.create({
      data: {
        listName: data.listName,
        description: data.description,
        isDefault: data.isDefault || false,
        items: data.items
          ? {
              create: data.items.map((item) => ({
                workType: item.workType,
                material: item.material,
                unitPrice: item.unitPrice,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
        _count: { select: { clients: true } },
      },
    });
  }

  async findAll(): Promise<PriceList[]> {
    return this.prisma.priceList.findMany({
      include: {
        items: true,
        _count: { select: { clients: true } },
      },
      orderBy: { listName: 'asc' },
    });
  }

  async findById(id: string): Promise<PriceList | null> {
    return this.prisma.priceList.findUnique({
      where: { id },
      include: {
        items: true,
        clients: true,
      },
    });
  }

  async findDefault(): Promise<PriceList | null> {
    return this.prisma.priceList.findFirst({
      where: { isDefault: true },
      include: { items: true },
    });
  }

  async update(id: string, data: Prisma.PriceListUpdateInput): Promise<PriceList> {
    if (data.isDefault === true) {
      await this.prisma.priceList.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.priceList.update({
      where: { id },
      data,
      include: { items: true, _count: { select: { clients: true } } },
    });
  }

  async updateItems(
    priceListId: string,
    items: { workType: WorkType; material: Material; unitPrice: number }[],
  ): Promise<PriceListItem[]> {
    // Upsert each item
    const results = await Promise.all(
      items.map((item) =>
        this.prisma.priceListItem.upsert({
          where: {
            priceListId_workType_material: {
              priceListId,
              workType: item.workType,
              material: item.material,
            },
          },
          update: { unitPrice: item.unitPrice },
          create: {
            priceListId,
            workType: item.workType,
            material: item.material,
            unitPrice: item.unitPrice,
          },
        }),
      ),
    );
    return results;
  }

  async delete(id: string): Promise<PriceList> {
    return this.prisma.priceList.delete({
      where: { id },
    });
  }

  async deleteItem(priceListId: string, itemId: string): Promise<PriceListItem> {
    return this.prisma.priceListItem.delete({
      where: { id: itemId, priceListId },
    });
  }

  async getPrice(
    priceListId: string,
    workType: WorkType,
    material: Material,
  ): Promise<number | null> {
    const item = await this.prisma.priceListItem.findUnique({
      where: {
        priceListId_workType_material: {
          priceListId,
          workType,
          material,
        },
      },
    });
    return item ? Number(item.unitPrice) : null;
  }
}
