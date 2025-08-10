import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildApp } from '../src/app';

export const prisma = new PrismaClient();

export async function resetDb() {
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
}

export async function createUser(data?: Partial<{ name: string; email: string; password: string; role: 'USER'|'ADMIN'; }>) {
  const name = data?.name ?? 'Tester';
  const email = data?.email ?? `tester${Date.now()}@test.com`;
  const password = await bcrypt.hash(data?.password ?? '123456', 10);
  const role = data?.role ?? 'USER';
  return prisma.user.create({ data: { name, email, password, role } });
}

export async function login(app: any, email: string, password = '123456') {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password }
  });
  const body = res.json();
  return body.access_token as string;
}
