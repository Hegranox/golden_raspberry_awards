import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
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

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
  }

  getCollection<T extends Record<string, any> = Record<string, any>>(name: string) {
    return this.db.collection<T>(name);
  }
}
