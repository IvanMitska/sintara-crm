import { IsString, IsNumber, IsOptional, IsDateString, IsArray, IsUUID, IsEnum, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealPriority, DealTemperature } from '@prisma/client';

class DealProductDto {
  @ApiProperty({ description: 'ID продукта' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Количество' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Цена за единицу' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Скидка в процентах' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;
}

export class CreateDealDto {
  @ApiProperty({ example: 'Продажа CRM системы', description: 'Название сделки' })
  @IsString()
  title: string;

  @ApiProperty({ example: 500000, description: 'Сумма сделки' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'RUB', description: 'Валюта', default: 'RUB' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 70, description: 'Вероятность закрытия (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Ожидаемая дата закрытия' })
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional({ description: 'Описание сделки' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID этапа воронки' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ description: 'ID контакта' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'ID компании' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Продукты в сделке', type: [DealProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DealProductDto)
  products?: DealProductDto[];

  @ApiPropertyOptional({ description: 'Кастомные поля', type: Object })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ enum: DealPriority, description: 'Приоритет сделки' })
  @IsOptional()
  @IsEnum(DealPriority)
  priority?: DealPriority;

  @ApiPropertyOptional({ enum: DealTemperature, description: 'Температура сделки' })
  @IsOptional()
  @IsEnum(DealTemperature)
  temperature?: DealTemperature;

  @ApiPropertyOptional({ description: 'Теги сделки', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}