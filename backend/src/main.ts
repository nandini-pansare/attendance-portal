import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session = require('express-session');


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://wispy-expensive-penny.ngrok-free.dev",
      "https://employee-attendance-port-7a0a4.web.app",
    ],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning"
    ] 
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'super-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 15 * 60 * 1000, // 15 minutes
        secure: true,      // cookie only sent over HTTPS (you have this via nginx+certbot)
        sameSite: 'none'
      },
    }),
  );
 
 await app.listen(process.env.PORT ?? 3000);
}

bootstrap();