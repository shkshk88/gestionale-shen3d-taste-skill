import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PriceListsService } from './price-lists.service';

@ApiTags('price-lists')
@Controller('price-lists')
// @UseGuards(AuthGuard('jwt')) // TODO: Re-enable after implementing login
@ApiBearerAuth()
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all price lists' })
  async findAll() {
    return this.priceListsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get price list by ID' })
  async findOne(@Param('id') id: string) {
    return this.priceListsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new price list' })
  async create(@Body() data: any) {
    return this.priceListsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update price list' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.priceListsService.update(id, data);
  }

  @Put(':id/items')
  @ApiOperation({ summary: 'Update price list items' })
  async updateItems(@Param('id') id: string, @Body() items: any[]) {
    return this.priceListsService.updateItems(id, items);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete price list' })
  async remove(@Param('id') id: string) {
    return this.priceListsService.delete(id);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Delete a single price list item' })
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.priceListsService.deleteItem(id, itemId);
  }
}
