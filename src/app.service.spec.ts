import { MovieFactory } from '@db/factories/movie.factory';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { AppRepository } from '@/app.repository';
import { AppService } from '@/app.service';

describe('AppService', () => {
  let service: AppService;

  const mockRepository = {
    upsertMany: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: AppRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AppService.processData', () => {
    it('should process data and call AppRepository.upsertMany', async () => {
      const movies = MovieFactory.buildList(3);
      mockRepository.upsertMany.mockResolvedValue(undefined);

      const result = await service.processData(movies);

      expect(mockRepository.upsertMany).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsertMany).toHaveBeenCalledWith(movies);
      expect(result).toEqual({
        message: 'Data processed successfully',
        count: 3,
      });
    });
  });

  describe('AppService.listProducerWinners', () => {
    it('should return empty arrays when no producers have at least 2 winner movies', async () => {
      const movies = MovieFactory.buildList(3, { winner: false });
      mockRepository.findAll.mockResolvedValue(movies);

      const result = await service.listProducerWinners();

      expect(result.min).toEqual([]);
      expect(result.max).toEqual([]);
    });

    it('should return min with 1 element and max with 1 element when only one interval exists', async () => {
      const producer = faker.person.fullName();

      const movies = [
        MovieFactory.build({ year: 1980, producers: producer, winner: true }),
        MovieFactory.build({ year: 1981, producers: producer, winner: true }),
      ];

      mockRepository.findAll.mockResolvedValue(movies);

      const result = await service.listProducerWinners();

      expect(result.min).toHaveLength(1);
      expect(result.max).toHaveLength(1);
      expect(result.min[0]).toMatchObject({
        producer,
        interval: 1,
        previousWin: 1980,
        followingWin: 1981,
      });
      expect(result.max[0]).toMatchObject({
        producer,
        interval: 1,
        previousWin: 1980,
        followingWin: 1981,
      });
    });

    it('should return min and max with multiple elements when multiple different intervals exist', async () => {
      const producer1 = faker.person.fullName();
      const producer2 = faker.person.fullName();
      const producer3 = faker.person.fullName();

      const movies = [
        MovieFactory.build({ year: 1980, producers: producer1, winner: true }),
        MovieFactory.build({ year: 1981, producers: producer1, winner: true }),
        MovieFactory.build({ year: 1990, producers: producer2, winner: true }),
        MovieFactory.build({ year: 1995, producers: producer2, winner: true }),
        MovieFactory.build({ year: 2000, producers: producer3, winner: true }),
        MovieFactory.build({ year: 2010, producers: producer3, winner: true }),
      ];

      mockRepository.findAll.mockResolvedValue(movies);

      const result = await service.listProducerWinners();

      expect(result.min).toHaveLength(1);
      expect(result.min[0]).toMatchObject({
        producer: producer1,
        interval: 1,
        previousWin: 1980,
        followingWin: 1981,
      });

      expect(result.max).toHaveLength(1);
      expect(result.max[0]).toMatchObject({
        producer: producer3,
        interval: 10,
        previousWin: 2000,
        followingWin: 2010,
      });
    });

    it('should return min and max with multiple elements when multiple producers have same min/max interval', async () => {
      const producer1 = faker.person.fullName();
      const producer2 = faker.person.fullName();
      const producer3 = faker.person.fullName();
      const producer4 = faker.person.fullName();

      const movies = [
        MovieFactory.build({ year: 1980, producers: producer1, winner: true }),
        MovieFactory.build({ year: 1981, producers: producer1, winner: true }),
        MovieFactory.build({ year: 1990, producers: producer2, winner: true }),
        MovieFactory.build({ year: 1991, producers: producer2, winner: true }),
        MovieFactory.build({ year: 2000, producers: producer3, winner: true }),
        MovieFactory.build({ year: 2010, producers: producer3, winner: true }),
        MovieFactory.build({ year: 2020, producers: producer4, winner: true }),
        MovieFactory.build({ year: 2030, producers: producer4, winner: true }),
      ];

      mockRepository.findAll.mockResolvedValue(movies);

      const result = await service.listProducerWinners();

      expect(result.min.length).toBeGreaterThan(1);
      expect(result.min.every((item) => item.interval === 1)).toBe(true);

      expect(result.max.length).toBeGreaterThan(1);
      expect(result.max.every((item) => item.interval === 10)).toBe(true);
    });
  });
});
