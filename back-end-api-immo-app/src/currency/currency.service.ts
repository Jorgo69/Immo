import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRateEntity } from './entities/currency-rate.entity';
import { CreateCurrencyRateDto } from './dto/create-currency-rate.dto';
import { UpdateCurrencyRateDto } from './dto/update-currency-rate.dto';

@Injectable()
export class CurrencyService implements OnModuleInit {
  constructor(
    @InjectRepository(CurrencyRateEntity)
    private readonly repo: Repository<CurrencyRateEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.repo.count();
    if (count === 0) {
      // Seed par défaut
      await this.repo.save([
        { currency_code: 'XOF', currency_symbol: 'FCFA', rate_to_cfa: 1, is_active: true },
        { currency_code: 'EUR', currency_symbol: '€', rate_to_cfa: 655.957, is_active: true },
        { currency_code: 'USD', currency_symbol: '$', rate_to_cfa: 600, is_active: true },
      ]);
    }
  }

  async findAll(): Promise<CurrencyRateEntity[]> {
    return this.repo.find({ order: { currency_code: 'ASC' } });
  }

  async findActive(): Promise<CurrencyRateEntity[]> {
    return this.repo.find({ where: { is_active: true }, order: { currency_code: 'ASC' } });
  }

  async findOne(id: string): Promise<CurrencyRateEntity> {
    const rate = await this.repo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException('Currency rate not found');
    return rate;
  }

  async create(dto: CreateCurrencyRateDto): Promise<CurrencyRateEntity> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCurrencyRateDto): Promise<CurrencyRateEntity> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
