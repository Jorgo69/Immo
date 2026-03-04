import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ContractType } from '../entities/lease.entity';

export class CreateLeaseDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  monthlyRent: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  depositAmount: number;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @IsString()
  @IsOptional()
  contractContent?: string;
}
