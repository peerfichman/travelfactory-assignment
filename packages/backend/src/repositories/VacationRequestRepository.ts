import { AppDataSource } from '../infrastructure/database';
import { VacationRequest, RequestStatus } from '../entities/VacationRequest';

export const VacationRequestRepository = AppDataSource.getRepository(VacationRequest).extend({
  async findOverlapping(userId: string, startDate: string, endDate: string, excludeId?: string) {
    const qb = this.createQueryBuilder('vr')
      .where('vr.user_id = :userId', { userId })
      .andWhere('vr.status != :rejected', { rejected: RequestStatus.REJECTED })
      .andWhere('vr.start_date <= :endDate', { endDate })
      .andWhere('vr.end_date >= :startDate', { startDate });

    if (excludeId) {
      qb.andWhere('vr.id != :excludeId', { excludeId });
    }

    return qb.getMany();
  },

  findPaginatedForValidator(options: {
    status?: RequestStatus;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const { status, userId, page, limit } = options;
    const qb = this.createQueryBuilder('vr')
      .leftJoinAndSelect('vr.user', 'user')
      .orderBy('vr.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('vr.status = :status', { status });
    if (userId) qb.andWhere('vr.user_id = :userId', { userId });

    return qb.getManyAndCount();
  },
});
