import { Movie } from '@db/collections/movie.schema';
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';
import { uuidv7 } from 'uuidv7';

export const MovieFactory = Factory.define<Movie>(({ params }) => ({
  _id: params._id ?? uuidv7(),
  year: params.year ?? faker.date.past().getFullYear(),
  title: params.title ?? faker.music.songName(),
  studios: params.studios ?? faker.company.name(),
  producers: params.producers ?? faker.person.fullName(),
  winner: params.winner ?? faker.datatype.boolean(),
  createdAt: params.createdAt ?? faker.date.past(),
  updatedAt: params.updatedAt ?? faker.date.recent(),
}));
