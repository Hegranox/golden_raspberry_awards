import { Movie } from '@db/collections/movie.schema';
import { DatabaseService } from '@db/database.service';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    await app.init();
  });

  afterEach(async () => {
    const collection = databaseService.getCollection<Movie>('movies');
    await collection.deleteMany({});
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('It works!');
  });

  describe('POST /populate', () => {
    //     it('should import CSV file and save data to database', async () => {
    //       const csvContent = `year;title;studios;producers;winner
    // 1980;Can't Stop the Music;Associated Film Distribution;Allan Carr;yes
    // 1980;Cruising;Lorimar Productions;Jerry Weintraub;no
    // 1980;The Formula;MGM;Steve Shagan;no`;

    //       const response = await request(app.getHttpServer())
    //         .post('/populate')
    //         .attach('file', Buffer.from(csvContent), 'movies.csv')
    //         .expect(201);

    //       expect(response.body).toEqual({
    //         message: 'Data processed successfully',
    //         count: 3,
    //       });

    //       const collection = databaseService.getCollection<Movie>('movies');
    //       const movies = await collection.find({}).toArray();

    //       expect(movies).toHaveLength(3);

    //       const firstMovie = movies.find(
    //         (m) => m.title.toLowerCase().trim() === "can't stop the music",
    //       );
    //       expect(firstMovie).toBeDefined();
    //       expect(firstMovie?.title).toBe("Can't Stop the Music");
    //       expect(firstMovie?.year).toBe(1980);
    //       expect(firstMovie?.studios).toBe('Associated Film Distribution');
    //       expect(firstMovie?.producers).toBe('Allan Carr');
    //       expect(firstMovie?.winner).toBe(true);
    //       expect(firstMovie?._id).toBeDefined();
    //       expect(firstMovie?.createdAt).toBeInstanceOf(Date);
    //       expect(firstMovie?.updatedAt).toBeInstanceOf(Date);

    //       const secondMovie = movies.find((m) => m.title.toLowerCase().trim() === 'cruising');
    //       expect(secondMovie).toBeDefined();
    //       expect(secondMovie?.title).toBe('Cruising');
    //       expect(secondMovie?.year).toBe(1980);
    //       expect(secondMovie?.winner).toBe(false);
    //     });

    it('should handle duplicate movies (upsert)', async () => {
      const csvContent1 = `year;title;studios;producers;winner
1980;Test Movie;Studio A;Producer A;yes`;

      const csvContent2 = `year;title;studios;producers;winner
1980;Test Movie;Studio B;Producer B;no`;

      await request(app.getHttpServer())
        .post('/populate')
        .attach('file', Buffer.from(csvContent1), 'movies1.csv')
        .expect(201);

      await request(app.getHttpServer())
        .post('/populate')
        .attach('file', Buffer.from(csvContent2), 'movies2.csv')
        .expect(201);

      const collection = databaseService.getCollection<Movie>('movies');
      const movies = await collection.find({}).toArray();

      expect(movies).toHaveLength(1);
      expect(movies[0].studios).toBe('Studio B');
      expect(movies[0].producers).toBe('Producer B');
      expect(movies[0].winner).toBe(false);
      expect(movies[0].createdAt).toBeInstanceOf(Date);
    });
  });
});
