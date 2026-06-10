import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createApiValidationPipe } from './common/validation/api-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(createApiValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Support RAG Evaluator API')
    .setDescription(
      'API for ingestion, retrieval, grounded chat, query logging, and evaluation.',
    )
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
void bootstrap();
