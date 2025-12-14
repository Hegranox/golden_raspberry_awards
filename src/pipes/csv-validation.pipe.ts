import { BadRequestException, PipeTransform } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import Joi from 'joi';

export interface CsvColumnConfig {
  name: string;
  schema: Joi.Schema;
  transform?: (value: string) => any;
}

export class CsvValidationPipe implements PipeTransform {
  private readonly columns: CsvColumnConfig[];
  private readonly joiSchema: Joi.ObjectSchema;

  constructor(columns: CsvColumnConfig[]) {
    if (!columns || columns.length === 0) {
      throw new Error('Columns configuration is required');
    }

    this.columns = columns;

    const schemaObject: Record<string, Joi.Schema> = {};

    columns.forEach((col) => {
      schemaObject[col.name] = col.schema;
    });

    this.joiSchema = Joi.object(schemaObject);
  }

  async transform(file: Express.Multer.File): Promise<Record<string, any>[]> {
    let records: Record<string, string>[];
    const validatedData: Record<string, any>[] = [];
    const errors: string[] = [];

    if (!file) throw new BadRequestException('File is required');

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv') throw new BadRequestException('File must be a CSV file');

    try {
      records = parse(file.buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ';',
      });
    } catch (_error) {
      throw new BadRequestException('Invalid CSV format');
    }

    if (records.length === 0) throw new BadRequestException('CSV file is empty');

    const requiredColumns = this.columns.map((col) => col.name);
    const csvColumns = Object.keys(records[0] || {});
    const missingColumns = requiredColumns.filter((col) => !csvColumns.includes(col));

    if (missingColumns.length > 0)
      throw new BadRequestException(`Missing required columns: ${missingColumns.join(', ')}`);

    records.forEach((record, index) => {
      const row: Record<string, any> = {};

      this.columns.forEach((col) => {
        const value = record[col.name] || '';
        row[col.name] = col.transform ? col.transform(value) : value;
      });

      const { error } = this.joiSchema.validate(row, { abortEarly: false });

      if (error) {
        errors.push(`Row ${index + 2}: ${error.details.map((d) => d.message).join(', ')}`);
      } else {
        validatedData.push(row);
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException(`Validation errors:\n${errors.join('\n')}`);
    }

    return validatedData;
  }
}
