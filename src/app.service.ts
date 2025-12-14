import { Movie } from '@db/collections/movie.schema';
import { Injectable } from '@nestjs/common';
import { AppRepository } from '@/app.repository';

@Injectable()
export class AppService {
  constructor(private readonly appRepository: AppRepository) {}

  itWorks(): string {
    return 'It works!';
  }

  async processData(data: Movie[]): Promise<{ message: string; count: number }> {
    await this.appRepository.upsertMany(data);
    return { message: 'Data processed successfully', count: data.length };
  }
}
