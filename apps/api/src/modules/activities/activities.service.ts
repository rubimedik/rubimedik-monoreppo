import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) {}

  async create(userId: string, type: string, title: string, description?: string, metadata?: any) {
    console.log(`DEBUG: Creating activity for user ${userId}: ${type} - ${title}`);
    const activity = this.activitiesRepository.create({
      user: { id: userId } as any,
      type,
      title,
      description,
      metadata,
    });
    const saved = await this.activitiesRepository.save(activity);
    console.log(`DEBUG: Activity saved with ID: ${saved.id}`);
    return saved;
  }

  async findByUser(userId: string, limit = 10) {
    console.log(`DEBUG: activities.service - findByUser for userId: ${userId}`);
    const activities = await this.activitiesRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    console.log(`DEBUG: activities.service - found ${activities.length} activities`);
    return activities;
  }
}
