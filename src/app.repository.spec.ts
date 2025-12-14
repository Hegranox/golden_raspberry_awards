import { Movie } from '@db/collections/movie.schema';
import { DatabaseModule } from '@db/database.module';
import { DatabaseService } from '@db/database.service';
import { MovieFactory } from '@db/factories/movie.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { AppRepository } from '@/app.repository';

describe('AppRepository', () => {
  let repository: AppRepository;
  let databaseService: DatabaseService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [AppRepository],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    await databaseService.onModuleInit();

    repository = module.get<AppRepository>(AppRepository);
    await repository.onModuleInit();
  });

  afterEach(async () => {
    const collection = databaseService.getCollection<Movie>('movies');
    await collection.deleteMany({});
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.onModuleDestroy();
    }
  });

  describe('upsertMany', () => {
    it('should insert multiple movies', async () => {
      const movies = MovieFactory.buildList(3);
      await repository.upsertMany(movies);

      const collection = databaseService.getCollection<Movie>('movies');
      const savedMovies = await collection.find({}).toArray();

      expect(savedMovies).toHaveLength(3);
      movies.forEach((movie) => {
        const saved = savedMovies.find((m) => m.title === movie.title && m.year === movie.year);
        expect(saved).toBeDefined();
        expect(saved?.title).toBe(movie.title);
        expect(saved?.year).toBe(movie.year);
        expect(saved?._id).toBeDefined();
        expect(saved?.createdAt).toBeInstanceOf(Date);
        expect(saved?.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('should handle duplicate movies (upsert)', async () => {
      const movie1 = MovieFactory.build({
        year: 1980,
        title: 'Test Movie',
        studios: 'Studio A',
        producers: 'Producer A',
        winner: true,
      });

      const movie2 = MovieFactory.build({
        year: 1980,
        title: 'Test Movie',
        studios: 'Studio B',
        producers: 'Producer B',
        winner: false,
      });

      await repository.upsertMany([movie1]);
      await repository.upsertMany([movie2]);

      const collection = databaseService.getCollection<Movie>('movies');
      const movies = await collection.find({}).toArray();

      expect(movies).toHaveLength(1);
      expect(movies[0].title).toBe('Test Movie');
      expect(movies[0].year).toBe(1980);
      expect(movies[0].studios).toBe('Studio B');
      expect(movies[0].producers).toBe('Producer B');
      expect(movies[0].winner).toBe(false);
      expect(movies[0].createdAt).toBeInstanceOf(Date);
    });

    it('should set createdAt only on creation', async () => {
      const movie = MovieFactory.build({
        year: 1980,
        title: 'Test Movie',
        studios: 'Studio A',
        producers: 'Producer A',
        winner: true,
      });

      await repository.upsertMany([movie]);

      const collection = databaseService.getCollection<Movie>('movies');
      const firstInsert = await collection.findOne({ title: movie.title, year: movie.year });
      const firstCreatedAt = firstInsert?.createdAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updatedMovie = MovieFactory.build({
        year: 1980,
        title: 'Test Movie',
        studios: 'Studio B',
        producers: 'Producer B',
        winner: false,
      });

      await repository.upsertMany([updatedMovie]);

      const secondInsert = await collection.findOne({ title: movie.title, year: movie.year });
      const secondCreatedAt = secondInsert?.createdAt;

      expect(firstCreatedAt).toEqual(secondCreatedAt);
      expect(secondInsert?.updatedAt.getTime()).toBeGreaterThan(
        firstInsert?.updatedAt.getTime() || 0,
      );
    });

    it('should update updatedAt on every upsert', async () => {
      const movie = MovieFactory.build({
        year: 1980,
        title: 'Test Movie',
        studios: 'Studio A',
        producers: 'Producer A',
        winner: true,
      });

      await repository.upsertMany([movie]);

      const collection = databaseService.getCollection<Movie>('movies');
      const firstInsert = await collection.findOne({ title: movie.title, year: movie.year });
      const firstUpdatedAt = firstInsert?.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      const updatedMovie = MovieFactory.build({
        year: 1980,
        title: 'Test Movie',
        studios: 'Studio B',
        producers: 'Producer B',
        winner: false,
      });

      await repository.upsertMany([updatedMovie]);

      const secondInsert = await collection.findOne({ title: movie.title, year: movie.year });
      const secondUpdatedAt = secondInsert?.updatedAt;

      expect(secondUpdatedAt?.getTime()).toBeGreaterThan(firstUpdatedAt?.getTime() || 0);
    });

    it('should remove duplicates within the same batch', async () => {
      const movies = [
        MovieFactory.build({
          year: 1980,
          title: 'Test Movie',
          studios: 'Studio A',
          producers: 'Producer A',
          winner: true,
        }),
        MovieFactory.build({
          year: 1980,
          title: 'Test Movie',
          studios: 'Studio B',
          producers: 'Producer B',
          winner: false,
        }),
        MovieFactory.build({
          year: 1980,
          title: 'Test Movie',
          studios: 'Studio C',
          producers: 'Producer C',
          winner: true,
        }),
      ];

      await repository.upsertMany(movies);

      const collection = databaseService.getCollection<Movie>('movies');
      const savedMovies = await collection.find({}).toArray();

      expect(savedMovies).toHaveLength(1);
      expect(savedMovies[0].studios).toBe('Studio C');
      expect(savedMovies[0].producers).toBe('Producer C');
      expect(savedMovies[0].winner).toBe(true);
    });

    it('should handle empty array', async () => {
      await repository.upsertMany([]);

      const collection = databaseService.getCollection<Movie>('movies');
      const savedMovies = await collection.find({}).toArray();

      expect(savedMovies).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return all movies', async () => {
      const movies = MovieFactory.buildList(3);
      await repository.upsertMany(movies);

      const result = await repository.findAll();

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining(
          movies.map((m) => expect.objectContaining({ title: m.title, year: m.year })),
        ),
      );
    });

    it('should return empty array when no movies exist', async () => {
      const result = await repository.findAll();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });
});
