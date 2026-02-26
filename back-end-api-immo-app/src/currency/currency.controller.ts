import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CreateCurrencyRateDto } from './dto/create-currency-rate.dto';
import { UpdateCurrencyRateDto } from './dto/update-currency-rate.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../auth/strategy/roles.decorator';
import { UserRole } from '../auth/models/user.model/user.model';

@Controller('currencies')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @UseGuards(JwtAuthGuard)
  @Get('active')
  findActive() {
    return this.currencyService.findActive();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.currencyService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateCurrencyRateDto) {
    return this.currencyService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCurrencyRateDto) {
    return this.currencyService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.currencyService.remove(id);
  }
}
