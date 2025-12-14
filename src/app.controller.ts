import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CsvColumnConfig, CsvValidationPipe } from '@pipes/csv-validation.pipe';
import Joi from 'joi';
import { AppService } from '@/app.service';
import { PopulateResponseDto } from '@/dto/populate-response.dto';
import { ProducerWinnersResponseDto } from '@/dto/producer-winners-response.dto';

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

@ApiTags('movies')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Returns "It works!"', type: String })
  itWorks(): string {
    return this.appService.itWorks();
  }

  @Get('/list-producer-winners')
  @ApiOperation({
    summary: 'Get producers with minimum and maximum intervals between consecutive wins',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns producers with min and max intervals',
    type: ProducerWinnersResponseDto,
  })
  listProducerWinners(): Promise<ProducerWinnersResponseDto> {
    return this.appService.listProducerWinners();
  }

  @Post('populate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and process CSV file with movie data' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: year, title, studios, producers, winner',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'CSV file processed successfully',
    type: PopulateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid CSV format or validation error' })
  async populate(
    @UploadedFile(new CsvValidationPipe(populateColumns)) data: any[],
  ): Promise<PopulateResponseDto> {
    await this.appService.processData(data);
    return { message: 'Data processed successfully', count: data.length };
  }
}
