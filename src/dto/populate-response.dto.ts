import { ApiProperty } from '@nestjs/swagger';

export class PopulateResponseDto {
  @ApiProperty({ example: 'Data processed successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: 4, description: 'Number of records processed' })
  count: number;
}
