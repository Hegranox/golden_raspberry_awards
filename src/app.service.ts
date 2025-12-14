import { Movie } from '@db/collections/movie.schema';
import { Injectable } from '@nestjs/common';
import { AppRepository } from '@/app.repository';
import { ProcessMovie } from '@/types/movies';

@Injectable()
export class AppService {
  constructor(private readonly appRepository: AppRepository) {}

  itWorks(): string {
    return 'It works!';
  }

  async listProducerWinners() {
    const allMovies = await this.appRepository.findAll();

    const producerMap = new Map<string, Movie[]>();
    for (const movie of allMovies) {
      if (!movie.producers) continue;

      const producers = movie.producers
        .split(/,| and /)
        .map((p) => p.trim())
        .filter(Boolean);

      for (const producer of producers) {
        const movies = producerMap.get(producer) || [];
        movies.push(movie);
        producerMap.set(producer, movies);
      }
    }

    const intervalsMap = new Map<
      number,
      Array<{ producer: string; interval: number; previousWin: number; followingWin: number }>
    >();

    for (const [producer, movies] of producerMap) {
      const winnerMovies = movies.filter((m) => m.winner).sort((a, b) => a.year - b.year);

      if (winnerMovies.length < 2) continue;

      for (let i = 1; i < winnerMovies.length; i++) {
        const interval = winnerMovies[i].year - winnerMovies[i - 1].year;
        const intervals = intervalsMap.get(interval) || [];

        intervals.push({
          producer,
          interval,
          previousWin: winnerMovies[i - 1].year,
          followingWin: winnerMovies[i].year,
        });

        intervalsMap.set(interval, intervals);
      }
    }

    const intervals = Array.from(intervalsMap.keys());

    const minInterval = Math.min(...intervals);
    const maxInterval = Math.max(...intervals);

    return {
      min: intervalsMap.get(minInterval) || [],
      max: intervalsMap.get(maxInterval) || [],
    };
  }

  async processData(data: ProcessMovie[]): Promise<{ message: string; count: number }> {
    await this.appRepository.upsertMany(data);
    return { message: 'Data processed successfully', count: data.length };
  }
}
