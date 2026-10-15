import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export const userService = {
  async list(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users');
    return data;
  },
};
