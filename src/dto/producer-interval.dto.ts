import { ApiProperty } from '@nestjs/swagger';

export class ProducerIntervalDto {
  @ApiProperty({ example: 'Producer Name', description: 'Name of the producer' })
  producer: string;

  @ApiProperty({ example: 5, description: 'Interval in years between consecutive wins' })
  interval: number;

  @ApiProperty({ example: 1980, description: 'Year of the previous win' })
  previousWin: number;

  @ApiProperty({ example: 1985, description: 'Year of the following win' })
  followingWin: number;
}
