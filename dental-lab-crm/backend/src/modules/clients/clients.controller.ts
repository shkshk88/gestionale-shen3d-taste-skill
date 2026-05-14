import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';

@ApiTags('clients')
@Controller('clients')
// @UseGuards(AuthGuard('jwt')) // TODO: Re-enable after implementing login
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const where = search
      ? {
          OR: [
            { studioName: { contains: search, mode: 'insensitive' as const } },
            { contactPerson: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [clients, total] = await Promise.all([
      this.clientsService.findAll({
        skip: skip ? parseInt(skip) : undefined,
        take: take ? parseInt(take) : undefined,
        where,
        orderBy: { studioName: 'asc' },
      }),
      this.clientsService.count(where),
    ]);

    return { data: clients, total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new client' })
  async create(@Body() data: any) {
    try {
      console.log('Received client data:', data);

      // Clean up priceListId - don't include if empty or undefined
      const { priceListId, ...clientData } = data;

      console.log('priceListId:', priceListId);
      console.log('Will connect priceList?', !!priceListId && priceListId !== 'undefined' && priceListId !== '1');

      const createData: any = { ...clientData };

      // Remove empty email to avoid unique constraint issues
      if (!createData.email || createData.email.trim() === '') {
        delete createData.email;
      }

      // Only add priceList relation if we have a valid UUID
      if (priceListId && priceListId !== 'undefined' && priceListId !== '1' && priceListId.length > 10) {
        createData.priceList = { connect: { id: priceListId } };
      }

      console.log('Final create data:', JSON.stringify(createData, null, 2));

      return await this.clientsService.create(createData);
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'campo';
        throw new BadRequestException(`${field} già esistente. Usa un valore diverso.`);
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client' })
  async update(@Param('id') id: string, @Body() data: any) {
    // Clean up priceListId - don't include if empty or undefined
    const { priceListId, ...clientData } = data;

    return this.clientsService.update(id, {
      ...clientData,
      ...(priceListId ? { priceList: { connect: { id: priceListId } } } : {}),
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  async remove(@Param('id') id: string) {
    return this.clientsService.delete(id);
  }
}
