import { Module } from '@nestjs/common';
import { QueryLogsService } from './query-logs.service';

@Module({
  providers: [QueryLogsService],
  exports: [QueryLogsService],
})
export class QueryLogsModule {}
