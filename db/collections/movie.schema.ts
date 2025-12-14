import { BaseCollection } from '@db/collections/base-collection.schema';

export interface Movie extends BaseCollection {
  year: number;
  title: string;
  studios: string;
  producers: string;
  winner: boolean;
}
