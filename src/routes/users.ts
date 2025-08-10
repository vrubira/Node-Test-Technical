import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { createUserSchema, updateUserSchema } from '../schemas/user';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function userRoutes(fastify: FastifyInstance) {

  fastify.post('/users', {
    schema: {
      ...createUserSchema,
      tags: ['Users'],
      summary: 'Crear un nuevo usuario',
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (req, reply) => {
    const { name, email, password } = req.body as any;
    const exists = await fastify.prisma.user.findUnique({ where: { email } });
    if (exists) return reply.code(409).send({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await fastify.prisma.user.create({ data: { name, email, password: hashed } });
    const { password: _omit, ...safe } = user as any;
    return reply.code(201).send(safe);
  });

  fastify.get('/users', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Listar usuarios',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string', enum: ['USER', 'ADMIN'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, async () => {
    return fastify.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
  });

  fastify.get('/users/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Obtener un usuario por ID',
      security: [{ bearerAuth: [] }]
    }
  }, async (req, reply) => {
    const id = Number((req.params as any).id);
    const requester = (req as any).user;

    if (requester.role !== 'ADMIN' && requester.id !== id) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const user = await fastify.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true,
        posts: { select: { id: true, title: true, content: true, createdAt: true } }
      }
    });
    if (!user) return reply.code(404).send({ message: 'Not found' });
    return user;
  });

  fastify.put('/users/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      ...updateUserSchema,
      tags: ['Users'],
      summary: 'Actualizar usuario',
      security: [{ bearerAuth: [] }]
    }
  }, async (req, reply) => {
    const id = Number((req.params as any).id);
    const requester = (req as any).user;
    if (requester.role !== 'ADMIN' && requester.id !== id) {
      return reply.code(403).send({ message: 'Forbidden' });
    }
    const data = { ...(req.body as any) };
    if (data.password) data.password = await bcrypt.hash(data.password, 10);

    try {
      const updated = await fastify.prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
      });
      return updated;
    } catch {
      return reply.code(404).send({ message: 'Not found' });
    }
  });

  fastify.delete('/users/:id', {
    preHandler: [fastify.authorize(['ADMIN'])],
    schema: {
      tags: ['Users'],
      summary: 'Eliminar usuario',
      security: [{ bearerAuth: [] }]
    }
  }, async (req, reply) => {
    const id = Number((req.params as any).id);
    try {
      await fastify.prisma.user.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ message: 'Not found' });
    }
  });

  fastify.post('/users/:id/avatar', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Subir avatar',
      security: [{ bearerAuth: [] }],
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            avatarUrl: { type: 'string' }
          }
        }
      }
    }
  }, async (req, reply) => {
    const id = Number((req.params as any).id);
    const requester = (req as any).user;

    if (requester.role !== 'ADMIN' && requester.id !== id) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const user = await fastify.prisma.user.findUnique({ where: { id } });
    if (!user) return reply.code(404).send({ message: 'User not found' });

    const parts = req.parts();
    let filePart: any = null;

    for await (const part of parts) {
      if (part.type === 'file' && part.file) {
        filePart = part;
        break;
      }
    }

    if (!filePart) {
      return reply.code(400).send({ message: 'No file provided' });
    }

    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(filePart.mimetype)) {
      return reply.code(415).send({ message: 'Unsupported media type' });
    }

    const ext = filePart.mimetype === 'image/png' ? '.png' : '.jpg';
    const name = crypto.randomBytes(16).toString('hex') + ext;
    const filePath = path.join(process.cwd(), 'uploads', name);

    const ws = fs.createWriteStream(filePath);
    await new Promise<void>((resolve, reject) => {
      filePart.file.pipe(ws);
      filePart.file.on('end', () => resolve());
      filePart.file.on('error', reject);
      ws.on('error', reject);
    });

    const publicUrl = `/uploads/${name}`;
    const updated = await fastify.prisma.user.update({
      where: { id },
      data: { avatarUrl: publicUrl },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true }
    });

    return reply.code(201).send(updated);
  });
}
