import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "jane@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "strongpass123" })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: "Jane Uwase" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiPropertyOptional({ example: "+250788123456" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ enum: ["INDIVIDUAL", "BUSINESS"], default: "INDIVIDUAL" })
  @IsOptional()
  @IsIn(["INDIVIDUAL", "BUSINESS"])
  accountType?: "INDIVIDUAL" | "BUSINESS";

  @ApiPropertyOptional({ example: "Acme Logistics Ltd", description: "Required when accountType is BUSINESS" })
  @ValidateIf((o) => o.accountType === "BUSINESS")
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  companyName?: string;
}
