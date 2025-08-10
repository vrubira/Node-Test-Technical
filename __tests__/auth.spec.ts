import { buildApp } from '../src/app';
import { createUser, resetDb, prisma } from './helpers';

describe('Auth', () => {
  let app: any;
  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await app.close(); await prisma.$disconnect(); });

  it('login OK devuelve JWT', async () => {
    await createUser({ email: 'user@test.com', password: '123456' });
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'user@test.com', password: '123456' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().access_token).toBeTruthy();
  });

  it('password incorrecto -> 401', async () => {
    await createUser({ email: 'u2@test.com', password: '123456' });
    const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'u2@test.com', password: 'wrongpass' } });
    expect(res.statusCode).toBe(401);
  });
});
