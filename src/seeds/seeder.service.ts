import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CsvColumnConfig, CsvValidationPipe } from '@pipes/csv-validation.pipe';
import Joi from 'joi';
import { AppService } from '@/app.service';
import { ProcessMovie } from '@/types/movies';

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

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private readonly appService: AppService) {}

  async onModuleInit() {
    const csvFileName = 'seeder.csv';
    const isProduction = __dirname.includes('dist');

    const csvFilePath = isProduction
      ? join(__dirname, '..', '..', 'assets', csvFileName)
      : join(__dirname, '..', 'assets', csvFileName);

    const csvContent = readFileSync(csvFilePath, 'utf-8');

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: csvFileName,
      encoding: 'utf-8',
      mimetype: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
      size: Buffer.byteLength(csvContent, 'utf-8'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const csvValidationPipe = new CsvValidationPipe(populateColumns);
    const validatedData = (await csvValidationPipe.transform(mockFile)) as ProcessMovie[];

    await this.appService.processData(validatedData);
  }
}
