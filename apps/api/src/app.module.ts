import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
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
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
