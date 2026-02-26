import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { CurrencyRateEntity } from './entities/currency-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyRateEntity])],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
