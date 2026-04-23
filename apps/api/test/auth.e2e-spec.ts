import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRole } from '@repo/shared';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    roles: [UserRole.PATIENT],
    fullName: 'Test User',
  };

  it('/v1/auth/signup (POST)', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send(testUser)
      .expect(201)
      .then((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);
      });
  });

  it('/v1/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200)
      .then((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });

  it('/v1/auth/profile (GET) - Protected', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.access_token;

    return request(app.getHttpServer())
      .get('/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((res) => {
        expect(res.body.email).toBe(testUser.email);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
