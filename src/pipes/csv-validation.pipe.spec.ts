import { faker } from '@faker-js/faker';
import { BadRequestException } from '@nestjs/common';
import { CsvColumnConfig, CsvValidationPipe } from '@pipes/csv-validation.pipe';
import Joi from 'joi';

describe('CsvValidationPipe', () => {
  const mockColumns: CsvColumnConfig[] = [
    { name: 'year', schema: Joi.number().required(), transform: (value) => Number(value) },
    { name: 'title', schema: Joi.string().required() },
    { name: 'studios', schema: Joi.string().required() },
    { name: 'producers', schema: Joi.string().required() },
    {
      name: 'winner',
      schema: Joi.boolean().required(),
      transform: (value) => value === 'yes',
    },
  ];

  const generateCsvContent = (
    rowCount = 1,
    customRows?: Array<{
      year?: number;
      title?: string;
      studios?: string;
      producers?: string;
      winner?: string;
    }>,
  ): string => {
    const columns = ['year', 'title', 'studios', 'producers', 'winner'];
    const header = columns.join(';');

    const rows = Array.from({ length: rowCount }, (_, index) => {
      if (customRows?.[index]) {
        const custom = customRows[index];
        const year = custom.year ?? faker.date.past().getFullYear();
        const title = custom.title ?? faker.music.songName();
        const studios = custom.studios ?? faker.company.name();
        const producers = custom.producers ?? faker.person.fullName();
        const winner = custom.winner ?? (faker.datatype.boolean() ? 'yes' : 'no');
        return `${year};${title};${studios};${producers};${winner}`;
      }

      const year = faker.date.past().getFullYear();
      const title = faker.music.songName();
      const studios = faker.company.name();
      const producers = faker.person.fullName();
      const winner = faker.datatype.boolean() ? 'yes' : 'no';

      return `${year};${title};${studios};${producers};${winner}`;
    });

    return `${header}\n${rows.join('\n')}`;
  };

  const createMockFile = (content: string, filename = 'test.csv'): Express.Multer.File => {
    return {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: 'text/csv',
      buffer: Buffer.from(content),
      size: Buffer.from(content).length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };
  };

  describe('constructor', () => {
    it('should throw error if columns is empty', () => {
      expect(() => new CsvValidationPipe([])).toThrow('Columns configuration is required');
    });

    it('should throw error if columns is null', () => {
      expect(() => new CsvValidationPipe(null as any)).toThrow('Columns configuration is required');
    });

    it('should create instance with valid columns', () => {
      const pipe = new CsvValidationPipe(mockColumns);
      expect(pipe).toBeInstanceOf(CsvValidationPipe);
    });
  });

  describe('transform', () => {
    let pipe: CsvValidationPipe;

    beforeEach(() => {
      pipe = new CsvValidationPipe(mockColumns);
    });

    it('should throw error if file is not provided', async () => {
      await expect(pipe.transform(null as any)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(null as any)).rejects.toThrow('File is required');
    });

    it('should throw error if file is not CSV', async () => {
      const file = createMockFile('content', 'test.txt');
      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('File must be a CSV file');
    });

    it('should throw error if CSV format is invalid', async () => {
      const file = createMockFile('invalid;csv;content\nbroken;line');
      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('Invalid CSV format');
    });

    it('should throw error if CSV file is empty', async () => {
      const file = createMockFile('');
      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('CSV file is empty');
    });

    it('should throw error if required columns are missing', async () => {
      const csvContent = `year;title
1980;Test Movie`;
      const file = createMockFile(csvContent);
      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('Missing required columns');
    });

    it('should validate and transform valid CSV data', async () => {
      const csvContent = generateCsvContent(2);
      const file = createMockFile(csvContent);

      const result = await pipe.transform(file);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('year');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('studios');
      expect(result[0]).toHaveProperty('producers');
      expect(result[0]).toHaveProperty('winner');
      expect(typeof result[0].year).toBe('number');
      expect(typeof result[0].title).toBe('string');
      expect(typeof result[0].winner).toBe('boolean');
    });

    it('should ignore columns not listed in configuration', async () => {
      const csvContent = generateCsvContent(1, [
        {
          year: 1980,
          title: 'Test Movie',
          studios: 'Studio A',
          producers: 'Producer A',
          winner: 'yes',
        },
      ]);
      const csvWithExtraColumn = csvContent
        .replace('winner', 'winner;extraColumn')
        .replace('yes', 'yes;extra value');
      const file = createMockFile(csvWithExtraColumn);

      const result = await pipe.transform(file);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('extraColumn');
      expect(result[0]).toEqual({
        year: 1980,
        title: 'Test Movie',
        studios: 'Studio A',
        producers: 'Producer A',
        winner: true,
      });
    });

    it('should throw error if validation fails', async () => {
      const csvContent = generateCsvContent(1, [
        {
          year: 'invalid' as any,
          title: 'Test Movie',
          studios: 'Studio A',
          producers: 'Producer A',
          winner: 'yes',
        },
      ]);
      const file = createMockFile(csvContent);

      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(file)).rejects.toThrow('Validation errors');
    });

    it('should collect multiple validation errors', async () => {
      const csvContent = generateCsvContent(2, [
        {
          year: 'invalid' as any,
          title: 'Test Movie',
          studios: 'Studio A',
          producers: 'Producer A',
          winner: 'invalid',
        },
        { year: 1980, title: '', studios: 'Studio B', producers: 'Producer B', winner: 'no' },
      ]);
      const file = createMockFile(csvContent);

      await expect(pipe.transform(file)).rejects.toThrow(BadRequestException);
      try {
        await pipe.transform(file);
      } catch (error: any) {
        expect(error.message).toContain('Row 2:');
        expect(error.message).toContain('Row 3:');
      }
    });

    it('should handle empty values with default empty string', async () => {
      const columnsWithOptional: CsvColumnConfig[] = [
        { name: 'year', schema: Joi.number().required(), transform: (value) => Number(value) },
        { name: 'title', schema: Joi.string().required() },
        { name: 'studios', schema: Joi.string().allow('') },
        { name: 'producers', schema: Joi.string().allow('') },
        {
          name: 'winner',
          schema: Joi.boolean().required(),
          transform: (value) => value === 'yes',
        },
      ];
      const pipeWithOptional = new CsvValidationPipe(columnsWithOptional);

      const csvContent = generateCsvContent(1, [
        { year: 1980, title: 'Test Movie', studios: 'Studio A', producers: '', winner: 'yes' },
      ]);
      const file = createMockFile(csvContent);

      const result = await pipeWithOptional.transform(file);

      expect(result).toHaveLength(1);
      expect(result[0].producers).toBe('');
    });

    it('should trim whitespace from CSV values', async () => {
      const csvContent = generateCsvContent(1, [
        {
          year: 1980,
          title: '  Test Movie  ',
          studios: '  Studio A  ',
          producers: '  Producer A  ',
          winner: 'yes',
        },
      ]);
      const file = createMockFile(csvContent);

      const result = await pipe.transform(file);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Movie');
      expect(result[0].studios).toBe('Studio A');
      expect(result[0].producers).toBe('Producer A');
    });

    it('should skip empty lines', async () => {
      const csvContent = generateCsvContent(2, [
        {
          year: 1980,
          title: 'Test Movie',
          studios: 'Studio A',
          producers: 'Producer A',
          winner: 'yes',
        },
        {
          year: 1981,
          title: 'Another Movie',
          studios: 'Studio B',
          producers: 'Producer B',
          winner: 'no',
        },
      ]);
      const csvWithEmptyLine = csvContent.replace('yes\n', 'yes\n\n');
      const file = createMockFile(csvWithEmptyLine);

      const result = await pipe.transform(file);

      expect(result).toHaveLength(2);
    });

    it('should handle transform function correctly', async () => {
      const csvContent = generateCsvContent(2);
      const file = createMockFile(csvContent);

      const result = await pipe.transform(file);

      expect(typeof result[0].year).toBe('number');
      expect(typeof result[0].winner).toBe('boolean');
      expect(typeof result[1].year).toBe('number');
      expect(typeof result[1].winner).toBe('boolean');
    });
  });
});
