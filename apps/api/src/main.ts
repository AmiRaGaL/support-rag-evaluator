import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApiValidationPipe } from './common/validation/api-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(createApiValidationPipe());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
void bootstrap();
