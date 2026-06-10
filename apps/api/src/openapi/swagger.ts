import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

export const OPENAPI_TITLE = 'Support RAG Evaluator API';
export const OPENAPI_DESCRIPTION =
  'API for ingestion, retrieval, grounded chat, query logging, and evaluation.';
export const OPENAPI_VERSION = '1.0';

export function setupSwagger(app: INestApplication): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle(OPENAPI_TITLE)
    .setDescription(OPENAPI_DESCRIPTION)
    .setVersion(OPENAPI_VERSION)
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument);

  return swaggerDocument;
}
