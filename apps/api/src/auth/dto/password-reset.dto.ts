import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "customer@tumanow.rw" })
  @IsString()
  @MinLength(3)
  identifier!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: "newstrongpass123" })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
