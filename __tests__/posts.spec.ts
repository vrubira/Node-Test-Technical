import { buildApp } from '../src/app';
import { createUser, login, resetDb, prisma } from './helpers';

describe('Posts', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('crear post (autor autenticado) -> 201', async () => {
    const author = await createUser({ email: 'author@test.com', password: '123456' });
    const token = await login(app, 'author@test.com', '123456');

    const res = await app.inject({
      method: 'POST',
      url: '/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Hello', content: 'World', authorId: author.id }
    });

    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json.title).toBe('Hello');
    expect(json.authorId).toBe(author.id);
  });

  it('otro usuario NO puede actualizar el post -> 403', async () => {
    const author = await createUser({ email: 'a2@test.com', password: '123456' });
    const intruder = await createUser({ email: 'x@test.com',  password: '123456' });
  
    const post = await prisma.post.create({
      data: { title: 'T1', content: 'C1', authorId: author.id }
    });
  
    const tokenIntruder = await login(app, 'x@test.com', '123456');
  
    const res = await app.inject({
      method: 'PUT',
      url: `/posts/${post.id}`,
      headers: { authorization: `Bearer ${tokenIntruder}` },
      payload: { title: 'Hack' }
    });
  
    expect(res.statusCode).toBe(403);
  });
});
