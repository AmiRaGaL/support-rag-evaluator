import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiAuthGuard } from './auth/api-auth.guard';
import { ChatModule } from './chat/chat.module';
import { EvalsModule } from './evals/evals.module';
import { HealthController } from './health.controller';
import { IngestionModule } from './ingestion/ingestion.module';
import { PrismaModule } from './prisma/prisma.module';
import { RetrievalModule } from './retrieval/retrieval.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IngestionModule,
    RetrievalModule,
    ChatModule,
    EvalsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ApiAuthGuard,
    },
  ],
})
export class AppModule {}
