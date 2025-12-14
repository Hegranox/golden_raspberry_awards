import { DatabaseModule } from '@db/database.module';
import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppRepository } from '@/app.repository';
import { AppService } from '@/app.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService, AppRepository],
})
export class AppModule {}
