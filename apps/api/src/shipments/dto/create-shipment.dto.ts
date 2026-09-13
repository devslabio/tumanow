import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DeliveryService } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

class PackageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  packageTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPerishable?: boolean;
}

export class CreateShipmentDto {
  @ApiProperty()
  @IsUUID()
  operatorId!: string;

  @ApiProperty()
  @IsString()
  pickupAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupContactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupInstructions?: string;

  @ApiProperty()
  @IsString()
  deliveryAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryContactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiPropertyOptional({ enum: DeliveryService })
  @IsOptional()
  @IsEnum(DeliveryService)
  deliveryService?: DeliveryService;

  @ApiPropertyOptional({ description: "Used for instant pricing estimate" })
  @IsOptional()
  @IsNumber()
  estimatedDistanceKm?: number;

  @ApiProperty({ type: [PackageDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages!: PackageDto[];

  @ApiPropertyOptional({ description: "Cash on delivery" })
  @IsOptional()
  @IsBoolean()
  isCod?: boolean;

  @ApiPropertyOptional({ description: "COD amount; defaults to quoted price" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  codAmount?: number;
}
