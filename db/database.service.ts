import { Injectable, OnModuleInit } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private mongoServer: MongoMemoryServer;
  private client: MongoClient;
  private db: Db;

  async onModuleInit() {
    this.mongoServer = await MongoMemoryServer.create();
    const connectionUri = this.mongoServer.getUri();

    this.client = new MongoClient(connectionUri);
    await this.client.connect();
    this.db = this.client.db();

    console.log('MongoDB Memory Server initialized');
  }

  getCollection<T extends Record<string, any> = Record<string, any>>(name: string) {
    return this.db.collection<T>(name);
  }
}
