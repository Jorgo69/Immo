import { IsString, IsNumber, IsBoolean, IsOptional, Length } from 'class-validator';

export class CreateCurrencyRateDto {
  @IsString()
  @Length(3, 10)
  currency_code: string;

  @IsString()
  @IsOptional()
  @Length(1, 10)
  currency_symbol?: string;

  @IsNumber()
  rate_to_cfa: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
