import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class ConfirmPhoneDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6)
  otp!: string;
}

export class ConfirmEmailDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
