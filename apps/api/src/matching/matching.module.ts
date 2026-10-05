import { Module } from "@nestjs/common";

import {
  MatchingCustomerController,
  MatchingPublicController,
} from "./matching.controller";
import { MatchingService } from "./matching.service";

@Module({
  controllers: [MatchingPublicController, MatchingCustomerController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
