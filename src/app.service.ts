import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  itWorks(): string {
    return 'It works!';
  }
}
