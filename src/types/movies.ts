import { Movie } from '@db/collections/movie.schema';

export type ProcessMovie = Omit<Movie, '_id' | 'createdAt' | 'updatedAt'>;
