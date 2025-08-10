import { buildApp } from './app';
(async () => {
  const app = await buildApp();
  await app.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Listening on http://0.0.0.0:3000');
})().catch((e) => { console.error(e); process.exit(1); });