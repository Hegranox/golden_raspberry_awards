import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvColumnConfig, CsvValidationPipe } from '@pipes/csv-validation.pipe';
import Joi from 'joi';
import { AppService } from '@/app.service';

const populateColumns: CsvColumnConfig[] = [
  { name: 'year', schema: Joi.number().required(), transform: (value) => Number(value) },
  { name: 'title', schema: Joi.string().required() },
  { name: 'studios', schema: Joi.string().required() },
  { name: 'producers', schema: Joi.string().required() },
  {
    name: 'winner',
    schema: Joi.boolean().required(),
    transform: (value) => value === 'yes',
  },
];

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  itWorks(): string {
    return this.appService.itWorks();
  }

  @Get('/list-producer-winners')
  listProducerWinners() {
    return this.appService.listProducerWinners();
  }

  @Post('populate')
  @UseInterceptors(FileInterceptor('file'))
  async populate(@UploadedFile(new CsvValidationPipe(populateColumns)) data: any[]) {
    await this.appService.processData(data);
    return { message: 'Data processed successfully', count: data.length };
  }
}
