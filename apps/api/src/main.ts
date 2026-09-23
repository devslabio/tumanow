import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "..", ".env") });

import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { RedactSensitiveInterceptor } from "./common/redact-sensitive.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  app.setGlobalPrefix("v1");
  app.useGlobalInterceptors(new RedactSensitiveInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("TumaNow API")
    .setDescription(
      "Multi-company courier & delivery platform — platform, operator & customer APIs.",
    )
    .setVersion("0.1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        in: "header",
      },
      "access-token",
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3345);
  await app.listen(port);
  console.info(`TumaNow API listening on http://127.0.0.1:${port}/v1`);
  console.info(`OpenAPI docs: http://127.0.0.1:${port}/docs`);
}

bootstrap();
