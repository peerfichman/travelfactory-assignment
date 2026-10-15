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
    statuses?: RequestStatus[];
    userIds?: string[];
    page: number;
    limit: number;
  }) {
    const { statuses, userIds, page, limit } = options;
    const qb = this.createQueryBuilder('vr')
      .leftJoinAndSelect('vr.user', 'user')
      .orderBy('vr.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (statuses && statuses.length > 0) qb.andWhere('vr.status IN (:...statuses)', { statuses });
    if (userIds && userIds.length > 0) qb.andWhere('vr.user_id IN (:...userIds)', { userIds });

    return qb.getManyAndCount();
  },
});
