import { FastifyInstance } from 'fastify';
import { createPostSchema } from '../schemas/post';

export default async function postRoutes(fastify: FastifyInstance) {

  fastify.post('/posts', {
    preHandler: [fastify.authenticate],
    schema: {
      ...createPostSchema,
      tags: ['Posts'],
      summary: 'Crear un nuevo post',
      security: [{ bearerAuth: [] }],
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string', nullable: true },
            authorId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (req, reply) => {
    const { title, content, authorId } = req.body as any;

    const requester = (req as any).user;
    if (requester.role !== 'ADMIN' && requester.id !== authorId) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const post = await fastify.prisma.post.create({
      data: { title, content, authorId }
    });

    fastify.wsHub.broadcast({
        type: 'post_created',
        post
    });

    return reply.code(201).send(post);
  });

  fastify.get('/posts', {
    schema: {
      tags: ['Posts'],
      summary: 'Listar todos los posts',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              title: { type: 'string' },
              content: { type: 'string', nullable: true },
              authorId: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, async () => {
    return fastify.prisma.post.findMany();
  });

  fastify.get('/posts/:id', {
    schema: {
      tags: ['Posts'],
      summary: 'Obtener un post por ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string', nullable: true },
            authorId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (req, reply) => {
    const id = Number((req.params as any).id);
    const post = await fastify.prisma.post.findUnique({ where: { id } });
    if (!post) return reply.code(404).send({ message: 'Post not found' });
    return post;
  });

  fastify.put('/posts/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          content: { type: 'string', nullable: true }
        },
        additionalProperties: false
      },
      tags: ['Posts'],
      summary: 'Actualizar un post',
      security: [{ bearerAuth: [] }]
    }
  }, async (req, reply) => {
    const id = Number((req.params as any).id);
    const requester = (req as any).user;

    const post = await fastify.prisma.post.findUnique({ where: { id } });
    if (!post) return reply.code(404).send({ message: 'Post not found' });
    if (requester.role !== 'ADMIN' && requester.id !== post.authorId) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const updated = await fastify.prisma.post.update({
      where: { id },
      data: req.body as any
    });

    fastify.wsHub.broadcast({
        type: 'post_updated',
        post: updated
    });

    return updated;
  });

  fastify.delete('/posts/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Posts'],
      summary: 'Eliminar un post',
      security: [{ bearerAuth: [] }]
    }
  }, async (req, reply) => {
    const id = Number((req.params as any).id);
    const requester = (req as any).user;

    const post = await fastify.prisma.post.findUnique({ where: { id } });
    if (!post) return reply.code(404).send({ message: 'Post not found' });
    if (requester.role !== 'ADMIN' && requester.id !== post.authorId) {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    await fastify.prisma.post.delete({ where: { id } });

    fastify.wsHub.broadcast({
        type: 'post_deleted',
        postId: id
    });

    return reply.code(204).send();
  });
}
