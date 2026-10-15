import { AppDataSource } from '../infrastructure/database';
import { User } from '../entities/User';

export const UserRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  },
});
