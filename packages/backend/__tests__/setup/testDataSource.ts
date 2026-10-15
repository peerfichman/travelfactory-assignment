import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from '../../src/entities/User';
import { VacationRequest } from '../../src/entities/VacationRequest';

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'tfuser',
  password: process.env.POSTGRES_PASSWORD ?? 'tfpassword',
  database: process.env.POSTGRES_DB_TEST ?? 'travelfactory_test',
  synchronize: true,
  logging: false,
  entities: [User, VacationRequest],
});

export async function initTestDb(): Promise<void> {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
}

export async function clearTestDb(): Promise<void> {
  await TestDataSource.query('TRUNCATE vacation_requests, users RESTART IDENTITY CASCADE');
}

export async function closeTestDb(): Promise<void> {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
}
