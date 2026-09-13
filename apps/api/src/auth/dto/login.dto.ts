import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@tumanow.rw" })
  @IsString()
  @MinLength(3)
  identifier!: string;

  @ApiProperty({ example: "demo1234" })
  @IsString()
  @MinLength(6)
  password!: string;

  /** When user belongs to multiple operators, pick one. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  operatorId?: string;
}
