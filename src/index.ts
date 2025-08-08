import Fastify from 'fastify';

const server = Fastify({ logger: true });

// Ruta raíz
server.get('/', async (request, reply) => {
  return { message: '¡Hola, mundo!' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Servidor escuchando en http://0.0.0.0:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
