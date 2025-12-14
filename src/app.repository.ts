import { Movie } from '@db/collections/movie.schema';
import { DatabaseService } from '@db/database.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Collection } from 'mongodb';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class AppRepository implements OnModuleInit {
  private collection: Collection<Movie>;

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    this.collection = this.databaseService.getCollection<Movie>('movies');
  }

  async upsertMany(documents: Partial<Movie>[]): Promise<void> {
    const now = new Date();
    const uniqueMap = new Map<string, Partial<Movie>>();

    documents.forEach((doc) => {
      const normalizedTitle = doc.title?.toLowerCase().trim();
      const key = `${normalizedTitle}|${doc.year}`;

      uniqueMap.set(key, doc);
    });

    const uniqueDocuments = Array.from(uniqueMap.values());

    const operations = uniqueDocuments.map((doc) => {
      return {
        updateOne: {
          upsert: true,
          filter: { title: doc.title, year: doc.year },
          update: {
            $set: { ...doc, updatedAt: now },
            $setOnInsert: { _id: uuidv7(), createdAt: now },
          },
        },
      };
    });

    if (operations.length > 0) {
      await this.collection.bulkWrite(operations);
    }
  }
}
