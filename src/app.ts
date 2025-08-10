import path from 'path';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import prismaPlugin from './plugins/prisma';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import wsPlugin from './plugins/ws';

export async function buildApp() {
  const server = Fastify({ logger: true });

  await server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'NodeTest Infordrona API',
        description: 'Documentación de la API con Swagger',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local' },
        { url: 'http://nodetest.infordrona.com:3000', description: 'Prod' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'full', deepLinking: false },
  });

  await server.register(multipart, { limits: { fileSize: 2 * 1024 * 1024, files: 1 } });
  await server.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  await server.register(wsPlugin);
  await server.register(authPlugin);
  await server.register(authRoutes);
  await server.register(prismaPlugin);
  await server.register(userRoutes);
  await server.register(postRoutes);

  server.get('/', async () => ({ ok: true }));
  return server;
}
