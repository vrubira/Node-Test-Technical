import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET as string,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  });

  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  fastify.decorate('authorize', (roles: string[]) => {
    return async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
        const role = request.user?.role;
        if (!roles.includes(role)) {
          return reply.code(403).send({ message: 'Forbidden' });
        }
      } catch (err) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
    };
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    authorize: (roles: string[]) => any;
  }
}
