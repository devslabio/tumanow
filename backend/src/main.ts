import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust proxy to get correct client IP (Express app instance)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  
  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3001', 'http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin: ${origin}`);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('TumaNow API')
    .setDescription(
      'Multi-Company Courier and Delivery Management Platform API.\n\n' +
      '## Features\n' +
      '- **Multi-Tenant Architecture**: Each operator (courier company) operates in complete data isolation\n' +
      '- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)\n' +
      '- **Order Management**: Complete order lifecycle from creation to delivery with POD\n' +
      '- **Vehicle-Based Assignment**: Orders assigned to vehicles, not drivers directly\n' +
      '- **Payment Processing**: Prepaid, COD, and corporate billing support\n' +
      '- **Tracking & POD**: Real-time tracking with OTP, photo, or signature proof of delivery\n' +
      '- **Multi-Channel Notifications**: Firebase push, email, SMS, and in-app notifications\n' +
      '- **Configuration-Driven**: Operators configure their capabilities (item types, delivery modes, payment methods)\n' +
      '- **Reporting & Analytics**: Comprehensive reports for operators and platform\n\n' +
      '## Authentication\n' +
      'All endpoints (except `/auth/login` and health check) require JWT authentication. ' +
      'Include the token in the Authorization header: `Bearer <token>`\n\n' +
      '## Multi-Tenancy\n' +
      'All data is isolated by `operator_id`. Operators can only access their own data. ' +
      'Platform admins can access all operators.\n\n' +
      '## Base URL\n' +
      'Development: `http://localhost:3001/api`\n' +
      'Production: Configured per environment\n\n' +
      'Use the "Authorize" button below to authenticate before making requests.'
    )
    .setVersion('1.0.0')
    .setContact('TumaNow', 'https://tumanow.com', 'support@tumanow.com')
    .setLicense('ISC', 'https://opensource.org/licenses/ISC')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Operators', 'Operator (tenant) management endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Roles', 'Role management endpoints')
    .addTag('Permissions', 'Permission management endpoints')
    .addTag('Vehicles', 'Vehicle management endpoints')
    .addTag('Drivers', 'Driver management endpoints')
    .addTag('Orders', 'Order lifecycle management endpoints')
    .addTag('Payments', 'Payment processing endpoints')
    .addTag('Tracking', 'Order tracking and POD endpoints')
    .addTag('Notifications', 'Notification management endpoints')
    .addTag('Reports', 'Reporting and analytics endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 TumaNow API running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}
bootstrap();

