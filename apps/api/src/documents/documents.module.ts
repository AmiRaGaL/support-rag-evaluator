import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
