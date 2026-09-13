import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { PublicService } from "./public.service";

@ApiTags("public")
@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get("operators")
  listOperators() {
    return this.publicService.listActiveOperators();
  }
}
