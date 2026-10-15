import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { VacationRequest } from './VacationRequest';

export enum UserRole {
  REQUESTER = 'Requester',
  VALIDATOR = 'Validator',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.REQUESTER })
  role!: UserRole;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => VacationRequest, (req) => req.user)
  vacationRequests!: VacationRequest[];
}
