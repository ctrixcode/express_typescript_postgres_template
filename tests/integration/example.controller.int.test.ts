import request from 'supertest';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';
import app from '@/app';
import { db } from '@/database';
import { examples } from '@/database/models/example.model';
import { generateAccessToken } from '@/utils/jwt.util';
import { Server } from 'http';

describe('Example Controller Integration', () => {
  let server: Server;
  let authToken: string;

  beforeAll(async () => {
    // Generate valid test JWT access token
    authToken = generateAccessToken({
      userId: 'test-user-123',
      email: 'tester@example.com',
    });

    server =
      (global as typeof globalThis & { server?: Server }).server ||
      app.listen(0);
  });

  afterAll(async () => {
    try {
      await db.delete(examples);
    } catch {
      // Ignore if DB is not available during mock runs
    }
    if (server && server.close) server.close();
  });

  afterEach(async () => {
    try {
      await db.delete(examples);
    } catch {
      // Ignore if DB is not available during mock runs
    }
  });

  describe('Authentication Enforcement', () => {
    it('should return 401 Unauthorized if Authorization header is missing', async () => {
      const res = await request(server).get('/api/examples').expect(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 Unauthorized if token is invalid', async () => {
      const res = await request(server)
        .get('/api/examples')
        .set('Authorization', 'Bearer definitely-invalid-token')
        .expect(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/examples', () => {
    it('should create a new example item when authenticated', async () => {
      const exampleData = {
        name: 'Test Item',
        description: 'A test item',
        price: 99,
        metadata: { category: 'electronics' },
      };
      const res = await request(server)
        .post('/api/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send(exampleData)
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Item');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(server)
        .post('/api/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/examples', () => {
    it('should return a list of example items when authenticated', async () => {
      await db.insert(examples).values([
        {
          name: 'Item 1',
          description: 'First',
          price: 10,
          metadata: {
            category: 'books',
            priority: 'medium',
            createdAt: new Date().toISOString(),
          },
        },
        {
          name: 'Item 2',
          description: 'Second',
          price: 20,
          metadata: {
            category: 'electronics',
            priority: 'medium',
            createdAt: new Date().toISOString(),
          },
        },
      ]);
      const res = await request(server)
        .get('/api/examples')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });
});
