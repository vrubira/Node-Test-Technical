import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', {
    schema: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              access_token: { type: 'string', description: 'JWT' },
              token_type: { type: 'string', example: 'Bearer' },
              expires_in: { type: 'string', example: '1h' }
            }
          },
          401: { type: 'object', properties: { message: { type: 'string' } } }
        }
    }
  }, async (req, reply) => {
    const { email, password } = req.body as any;

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return reply.code(401).send({ message: 'Invalid credentials' });

    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
    return reply.send({ access_token: token, token_type: 'Bearer', expires_in: process.env.JWT_EXPIRES_IN || '1h' });
  });
}
