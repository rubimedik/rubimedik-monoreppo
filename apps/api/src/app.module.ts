import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SpecialistsModule } from './modules/specialists/specialists.module';
import { DonationsModule } from './modules/donations/donations.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { ChatModule } from './modules/chat/chat.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { StorageModule } from './modules/storage/storage.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test', 'provision').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        PAYSTACK_SECRET_KEY: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        // GOOGLE_CLIENT_SECRET: Joi.string().optional(),
        GOOGLE_CLIENT_ID_IOS: Joi.string().optional(),
        GOOGLE_CLIENT_ID_ANDROID: Joi.string().optional(),
        APP_URL: Joi.string().required(),
        ANTHROPIC_API_KEY: Joi.string().optional(),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        CONSULTATION_GRACE_PERIOD_HOURS: Joi.number().default(48),
        CONSULTATION_GRACE_PERIOD_MINUTES: Joi.number().default(0),
        FOLLOWUP_WINDOW_DAYS: Joi.number().default(30),
        BLOOD_DONATION_INTERVAL_WHOLE_BLOOD: Joi.number().default(56),
        BLOOD_DONATION_INTERVAL_PLATELET: Joi.number().default(7),
        BLOOD_DONATION_INTERVAL_DOUBLE_RED_CELL: Joi.number().default(112),
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get('REDIS_URL'),
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SpecialistsModule,
    DonationsModule,
    HospitalsModule,
    ReferralsModule,
    ConsultationsModule,
    ChatModule,
    WalletModule,
    PaymentsModule,
    AdminModule,
    AiModule,
    ActivitiesModule,
  ],
})
export class AppModule {}
