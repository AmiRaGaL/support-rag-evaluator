import { Module } from '@nestjs/common';
import { QueryLogsController } from './query-logs.controller';
import { QueryLogsService } from './query-logs.service';

@Module({
  controllers: [QueryLogsController],
  providers: [QueryLogsService],
  exports: [QueryLogsService],
})
export class QueryLogsModule {}
