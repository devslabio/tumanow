import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "..", ".env") });

import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { RedactSensitiveInterceptor } from "./common/redact-sensitive.interceptor";

/**
 * CORS only gates browser clients (the web app, Swagger UI) — mobile HTTP
 * clients aren't subject to it. Defaults to the known local dev origins;
 * set CORS_ORIGINS (comma-separated) for anything else, and it's required
 * in production rather than silently reflecting every origin.
 */
function resolveCorsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGINS;
  if (raw) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (process.env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGINS must be set in production (comma-separated allowed origins)");
  }
  new Logger("Bootstrap").warn(
    "CORS_ORIGINS is not set — defaulting to localhost dev origins only. Set CORS_ORIGINS before deploying.",
  );
  return ["http://127.0.0.1:3006", "http://localhost:3006"];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: resolveCorsOrigins() });
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
