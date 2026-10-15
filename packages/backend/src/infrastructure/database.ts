import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { VacationRequest } from '../entities/VacationRequest';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'tfuser',
  password: process.env.POSTGRES_PASSWORD ?? 'tfpassword',
  database: process.env.POSTGRES_DB ?? 'travelfactory',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, VacationRequest],
  migrations: ['migrations/*.ts'],
  subscribers: [],
});
