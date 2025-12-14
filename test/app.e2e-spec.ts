import { Movie } from '@db/collections/movie.schema';
import { DatabaseService } from '@db/database.service';
import { faker } from '@faker-js/faker';
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
    it('should import CSV file with multiple lines and save data to database', async () => {
      const csvContent = `year;title;studios;producers;winner
1980;Can't Stop the Music;Associated Film Distribution;Allan Carr;yes
1980;Cruising;Lorimar Productions;Jerry Weintraub;no
1980;The Formula;MGM;Steve Shagan;no
1981;Mommy Dearest;Paramount Pictures;Frank Yablans;yes`;

      const response = await request(app.getHttpServer())
        .post('/populate')
        .attach('file', Buffer.from(csvContent), 'movies.csv')
        .expect(201);

      expect(response.body).toEqual({
        message: 'Data processed successfully',
        count: 4,
      });

      const collection = databaseService.getCollection<Movie>('movies');
      const movies = await collection.find({}).toArray();

      expect(movies).toHaveLength(4);
    });
  });

  describe('GET /list-producer-winners', () => {
    it('should return min and max intervals for producers with multiple wins', async () => {
      const collection = databaseService.getCollection<Movie>('movies');

      const producerA = faker.person.fullName();
      const producerB = faker.person.fullName();
      const producerC = faker.person.fullName();

      const studioA = faker.company.name();
      const studioB = faker.company.name();
      const studioC = faker.company.name();

      const yearA1 = 1980;
      const yearA2 = 1981;
      await collection.insertMany([
        {
          _id: faker.string.uuid(),
          year: yearA1,
          title: faker.music.songName(),
          studios: studioA,
          producers: producerA,
          winner: true,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
        {
          _id: faker.string.uuid(),
          year: yearA2,
          title: faker.music.songName(),
          studios: studioA,
          producers: producerA,
          winner: true,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
      ]);

      const yearB1 = 1990;
      const yearB2 = 2000;
      await collection.insertMany([
        {
          _id: faker.string.uuid(),
          year: yearB1,
          title: faker.music.songName(),
          studios: studioB,
          producers: producerB,
          winner: true,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
        {
          _id: faker.string.uuid(),
          year: yearB2,
          title: faker.music.songName(),
          studios: studioB,
          producers: producerB,
          winner: true,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
      ]);

      const yearC1 = 2005;
      const yearC2 = 2015;
      await collection.insertMany([
        {
          _id: faker.string.uuid(),
          year: yearC1,
          title: faker.music.songName(),
          studios: studioC,
          producers: producerC,
          winner: true,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
        {
          _id: faker.string.uuid(),
          year: yearC2,
          title: faker.music.songName(),
          studios: studioC,
          producers: producerC,
          winner: true,
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
        },
      ]);

      const response = await request(app.getHttpServer()).get('/list-producer-winners').expect(200);

      expect(response.body).toHaveProperty('min');
      expect(response.body).toHaveProperty('max');
      expect(Array.isArray(response.body.min)).toBe(true);
      expect(Array.isArray(response.body.max)).toBe(true);

      expect(response.body.min).toHaveLength(1);
      expect(response.body.min[0]).toMatchObject({
        producer: producerA,
        interval: 1,
        previousWin: yearA1,
        followingWin: yearA2,
      });

      expect(response.body.max).toHaveLength(2);
      expect(response.body.max).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            producer: producerB,
            interval: 10,
            previousWin: yearB1,
            followingWin: yearB2,
          }),
          expect.objectContaining({
            producer: producerC,
            interval: 10,
            previousWin: yearC1,
            followingWin: yearC2,
          }),
        ]),
      );
    });
  });
});
