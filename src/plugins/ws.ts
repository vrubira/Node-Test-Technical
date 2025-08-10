// src/plugins/ws.ts
import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import type { FastifyPluginAsync } from 'fastify';

type WS = any;

const wsPlugin: FastifyPluginAsync = fp(async (fastify) => {

  await fastify.register(websocket, { options: { perMessageDeflate: false } });

  const clients = new Set<WS>();

  const broadcast = (msg: unknown) => {
    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
    fastify.log.info({ clients: clients.size, payload }, 'WS broadcast');
    for (const client of clients) {
      try {
        if (client.readyState === client.OPEN) client.send(payload);
      } catch (err) {
        fastify.log.warn(err as any, 'WS send error');
      }
    }
  };

  fastify.decorate('wsHub', { clients, broadcast });

  fastify.get('/ws', { websocket: true }, (socket, req) => {
    clients.add(socket);
    fastify.log.info(
      { clients: clients.size, hasSend: typeof socket.send === 'function' },
      'WS client connected'
    );

    try {
      socket.send(JSON.stringify({ type: 'hello' }));
    } catch (err) {
      fastify.log.warn(err as any, 'WS hello send error');
    }

    socket.on('close', () => {
      clients.delete(socket);
      fastify.log.info({ clients: clients.size }, 'WS client disconnected');
    });

    socket.on('message', (message: Buffer) => {
      fastify.log.info({ message: message.toString() }, 'WS message received');
    });
  });
});

export default wsPlugin;

declare module 'fastify' {
  interface FastifyInstance {
    wsHub: {
      clients: Set<any>;
      broadcast: (msg: unknown) => void;
    };
  }
}
