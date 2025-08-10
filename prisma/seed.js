const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Crear usuario
  const user = await prisma.user.create({
    data: {
      name: 'Victor',
      email: 'vrubiramarin@gmail.com',
      password: '123456',
      role: 'ADMIN',
      posts: {
        create: [
          { title: 'Primer post', content: 'Contenido del primer post' },
          { title: 'Segundo post', content: 'Contenido del segundo post' }
        ]
      }
    },
    include: { posts: true }
  });

  console.log('Usuario creado con posts:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
