import { Movie } from '@db/collections/movie.schema';
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { uuidv7 } from 'uuidv7';
import { ProcessMovie } from '@/types/movies';

class MovieFactoryClass extends Factory<Movie | ProcessMovie> {
  onUpdate() {
    return this.params({
      _id: uuidv7(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    });
  }
}

export const MovieFactory = MovieFactoryClass.define(({ params }) => ({
  year: params.year ?? faker.date.past().getFullYear(),
  title: params.title ?? faker.music.songName(),
  studios: params.studios ?? faker.company.name(),
  producers: params.producers ?? faker.person.fullName(),
  winner: params.winner ?? faker.datatype.boolean(),
}));
