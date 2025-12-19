import { DatabaseModule } from '@db/database.module';
import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppRepository } from '@/app.repository';
import { AppService } from '@/app.service';
import { SeederService } from '@/seeds/seeder.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService, AppRepository, SeederService],
})
export class AppModule {}
