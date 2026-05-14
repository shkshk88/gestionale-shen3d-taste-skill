import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DentistsService } from './dentists.service';

@ApiTags('dentists')
@Controller('dentists')
// @UseGuards(AuthGuard('jwt')) // TODO: Re-enable after implementing login
@ApiBearerAuth()
export class DentistsController {
  constructor(private readonly dentistsService: DentistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dentists' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
  ) {
    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [dentists, total] = await Promise.all([
      this.dentistsService.findAll({
        skip: skip ? parseInt(skip) : undefined,
        take: take ? parseInt(take) : undefined,
        where,
      }),
      this.dentistsService.count(where),
    ]);

    return { data: dentists, total };
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all dentists for a client' })
  async findByClientId(@Param('clientId') clientId: string) {
    return this.dentistsService.findByClientId(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dentist by ID' })
  async findOne(@Param('id') id: string) {
    return this.dentistsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new dentist' })
  async create(@Body() data: any) {
    const { clientId, ...dentistData } = data;

    return this.dentistsService.create({
      ...dentistData,
      client: { connect: { id: clientId } },
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dentist' })
  async update(@Param('id') id: string, @Body() data: any) {
    const { clientId, ...dentistData } = data;

    return this.dentistsService.update(id, {
      ...dentistData,
      ...(clientId ? { client: { connect: { id: clientId } } } : {}),
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dentist' })
  async remove(@Param('id') id: string) {
    return this.dentistsService.delete(id);
  }
}
