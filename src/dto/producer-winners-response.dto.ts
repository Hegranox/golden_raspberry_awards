import { ApiProperty } from '@nestjs/swagger';
import { ProducerIntervalDto } from '@/dto/producer-interval.dto';

export class ProducerWinnersResponseDto {
  @ApiProperty({
    type: [ProducerIntervalDto],
    description: 'Producers with the minimum interval between consecutive wins',
    example: [
      {
        producer: 'Producer A',
        interval: 1,
        previousWin: 1980,
        followingWin: 1981,
      },
    ],
  })
  min: ProducerIntervalDto[];

  @ApiProperty({
    type: [ProducerIntervalDto],
    description: 'Producers with the maximum interval between consecutive wins',
    example: [
      {
        producer: 'Producer B',
        interval: 10,
        previousWin: 1990,
        followingWin: 2000,
      },
    ],
  })
  max: ProducerIntervalDto[];
}
