# Node-Test-Technical

Proyecto Prueba técnica.

Repositorio: [https://github.com/vrubira/Node-Test-Technical](https://github.com/vrubira/Node-Test-Technical)

---

## Tecnologías utilizadas

- Node.js (runtime)
- Fastify (framework HTTP)
- Prisma ORM (ORM para PostgreSQL)
- PostgreSQL (base de datos)
- Swagger (documentación interactiva)
- Jest (testing)
- cross-env (variables de entorno multiplataforma)
- bcrypt (hash de contraseñas)
- jsonwebtoken (JWT para autenticación)

---

## Instalación y configuración

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/vrubira/Node-Test-Technical.git
   cd Node-Test-Technical
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:  
   Crear un archivo `.env` en la raíz del proyecto:
   ```env
   DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/nodetest?schema=public
   JWT_SECRET=supersecret
   ```

4. Crear base de datos y tablas:
   ```bash
   createdb nodetest
   npx prisma migrate dev
   ```

5. Levantar el servidor:
   ```bash
   npm run dev
   ```
   La API estará disponible en `http://localhost:3000`

---

## Documentación Swagger

Disponible en:
```
http://localhost:3000/docs
```
El botón "Authorize" permite introducir el **Bearer Token** para acceder a rutas protegidas desde Swagger.

---

## Estructura del proyecto

```
├── README.md
├── __tests__
│   ├── auth.spec.ts
│   ├── helpers.ts
│   └── posts.spec.ts
├── jest.config.ts
├── package-lock.json
├── package.json
├── prisma
│   ├── migrations
│   │   ├── 20250809181538_init
│   │   │   └── migration.sql
│   │   ├── 20250809233557_add_avatar_to_user
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── seed.js
├── src
│   ├── app.ts
│   ├── index.ts
│   ├── plugins
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── ws.ts
│   ├── routes
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   └── users.ts
│   └── schemas
│       ├── post.ts
│       └── user.ts
├── tsconfig.json
└── uploads
    └── 76ebe6fa25b5ff29d5800e580c090631.jpg
```

---

## Endpoints principales

**Auth**
- POST `/auth/register` → Registrar usuario
- POST `/auth/login` → Iniciar sesión y obtener JWT

**Users**
- GET `/users` → Listar usuarios
- GET `/users/:id` → Obtener usuario por ID
- PUT `/users/:id` → Actualizar usuario (propietario)
- DELETE `/users/:id` → Eliminar usuario (propietario)

**Posts**
- POST `/posts` → Crear post (requiere JWT)
- GET `/posts` → Listar posts
- GET `/posts/:id` → Obtener post por ID
- PUT `/posts/:id` → Actualizar post (solo propietario)
- DELETE `/posts/:id` → Eliminar post (solo propietario)

---

## Testing

El proyecto usa Jest con una base de datos separada para pruebas (`nodetest_test`).

1. Crear base de datos de test:
   ```bash
   createdb nodetest_test
   ```

2. Ejecutar migraciones en la base de datos de test:
   ```bash
   npm run db:test:init
   ```

3. Ejecutar todos los tests:
   ```bash
   npm run test
   ```

En `package.json`:
```json
"scripts": {
  "db:test:init": "cross-env DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/nodetest_test?schema=public prisma migrate deploy",
  "test": "npm run db:test:init && cross-env DATABASE_URL=postgresql://usuario:password@127.0.0.1:5432/nodetest_test?schema=public jest --runInBand"
}
```

Salida esperada:
```
 PASS  __tests__/auth.spec.ts
  Auth
    ✓ login OK devuelve JWT (441 ms)
    ✓ password incorrecto -> 401 (289 ms)

 PASS  __tests__/posts.spec.ts
  Posts
    ✓ crear post (autor autenticado) -> 201 (404 ms)
    ✓ otro usuario NO puede actualizar el post -> 403 (407 ms)
```

---

## Autenticación

- Contraseñas almacenadas con bcrypt.
- JWT con expiración configurable.
- Rutas protegidas con validación del token.
- Control de acceso: solo el propietario puede modificar o eliminar sus recursos.

---

## Notas

- Base de datos de desarrollo y test separadas.
- Migraciones automáticas antes de correr los tests.
- Swagger para probar la API de forma interactiva.

---

## Mejoras y posibles ampliaciones

- Implementar **arquitectura de microservicios** para separar responsabilidades (por ejemplo: servicio de autenticación, servicio de usuarios, servicio de posts).
- Añadir **servicio de WebSockets** independiente para comunicación en tiempo real.
- Configurar **CI/CD** para despliegues automáticos y tests en cada commit.
- Añadir más cobertura de **tests unitarios y de integración**.
- Implementar **monitorización y logging centralizado**.
- Añadir soporte para **Docker** y **docker-compose** para levantar el entorno completo (app + base de datos) fácilmente.
- Mejorar la **validación de datos** y gestión de errores.
