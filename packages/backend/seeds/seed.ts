import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { AppDataSource } from '../src/infrastructure/database';
import { User, UserRole } from '../src/entities/User';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('password123', 10);

  const seedUsers = [
    { name: 'Alice Martin', email: 'alice@example.com', role: UserRole.REQUESTER },
    { name: 'Bob Dupont', email: 'bob@example.com', role: UserRole.REQUESTER },
    { name: 'Carol Dubois', email: 'carol@example.com', role: UserRole.VALIDATOR },
  ];

  for (const data of seedUsers) {
    const existing = await userRepo.findOne({ where: { email: data.email } });
    if (!existing) {
      await userRepo.save(userRepo.create({ ...data, password: hashedPassword }));
      console.log(`Created user: ${data.email} (${data.role})`);
    } else {
      console.log(`User already exists: ${data.email}`);
    }
  }

  await AppDataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
