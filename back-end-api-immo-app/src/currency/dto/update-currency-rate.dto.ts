import { IsString, IsNumber, IsBoolean, IsOptional, Length } from 'class-validator';

export class UpdateCurrencyRateDto {
  @IsOptional()
  @IsString()
  @Length(3, 10)
  currency_code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  currency_symbol?: string;

  @IsOptional()
  @IsNumber()
  rate_to_cfa?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
