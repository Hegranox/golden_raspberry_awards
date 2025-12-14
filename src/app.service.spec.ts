import { MovieFactory } from '@db/factories/movie.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { AppRepository } from '@/app.repository';
import { AppService } from '@/app.service';

describe('AppService', () => {
  let service: AppService;

  const mockRepository = {
    upsertMany: jest.fn(),
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
});
