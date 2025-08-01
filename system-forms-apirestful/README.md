# System Forms API RESTful

Sistema de API RESTful para encuestas de satisfacción técnica con arquitectura multi-rol y multi-torre.

## 🚀 Características

- **Autenticación JWT** con refresh tokens
- **Sistema de roles** jerárquico (Super Admin, Admin, Evaluator, Guest)
- **Sistema de permisos por grupos** con control granular
- **Arquitectura multi-torre** organizacional
- **Formularios dinámicos** con múltiples tipos de preguntas
- **Seguimiento de técnicos** y evaluaciones
- **Validación robusta** con class-validator
- **Base de datos PostgreSQL** con TypeORM
- **Documentación API** con Swagger

## 🏗️ Arquitectura

### Entidades Principales

- **Users**: Usuarios del sistema con roles y torres asignadas
- **Roles**: Roles jerárquicos del sistema
- **Towers**: Torres organizacionales
- **Groups**: Grupos de permisos
- **Permissions**: Permisos granulares del sistema
- **Forms**: Formularios de evaluación
- **Questions**: Preguntas de los formularios
- **Responses**: Respuestas de las evaluaciones
- **Technicians**: Técnicos evaluados

### Sistema de Permisos

El sistema implementa un modelo híbrido de control de acceso:

1. **Roles Base**: Definen el nivel general de acceso
2. **Grupos de Permisos**: Proporcionan control granular por recursos
3. **Asignación Flexible**: Los usuarios pueden pertenecer a múltiples grupos

#### Permisos Predefinidos

| Recurso | Acciones | Descripción |
|---------|----------|-------------|
| users | create, read, update, delete | Gestión de usuarios |
| roles | create, read, update, delete | Gestión de roles |
| towers | create, read, update, delete | Gestión de torres |
| forms | create, read, update, delete | Gestión de formularios |
| questions | create, read, update, delete | Gestión de preguntas |
| responses | create, read, update, delete | Gestión de respuestas |
| technicians | create, read, update, delete | Gestión de técnicos |
| permissions | create, read, update, delete | Gestión de permisos |
| groups | create, read, update, delete | Gestión de grupos |

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## ⚙️ Configuración

Crear archivo `.env` con las siguientes variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=system_forms

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development
```

## 🗄️ Base de Datos

```bash
# Ejecutar migraciones
npm run migration:run

# Poblar datos iniciales
npm run seed

# Generar nueva migración
npm run migration:generate -- src/migrations/MigrationName
```

## 🚀 Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
```

## 📡 API Endpoints

### Autenticación

- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Cerrar sesión

### Usuarios

- `GET /users` - Listar usuarios (con paginación)
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear usuario
- `PUT /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Roles

- `GET /roles` - Listar roles
- `GET /roles/:id` - Obtener rol por ID
- `POST /roles` - Crear rol
- `PUT /roles/:id` - Actualizar rol
- `DELETE /roles/:id` - Eliminar rol

### Torres

- `GET /towers` - Listar torres
- `GET /towers/:id` - Obtener torre por ID
- `POST /towers` - Crear torre
- `PUT /towers/:id` - Actualizar torre
- `DELETE /towers/:id` - Eliminar torre

### Grupos y Permisos

- `GET /groups` - Listar grupos
- `POST /groups` - Crear grupo
- `PUT /groups/:id` - Actualizar grupo
- `DELETE /groups/:id` - Eliminar grupo
- `GET /permissions` - Listar permisos
- `POST /permissions` - Crear permiso

### Formularios

- `GET /forms` - Listar formularios
- `GET /forms/:id` - Obtener formulario por ID
- `POST /forms` - Crear formulario
- `PUT /forms/:id` - Actualizar formulario
- `DELETE /forms/:id` - Eliminar formulario

### Técnicos

- `GET /technicians` - Listar técnicos
- `GET /technicians/:id` - Obtener técnico por ID
- `POST /technicians` - Crear técnico
- `PUT /technicians/:id` - Actualizar técnico
- `DELETE /technicians/:id` - Eliminar técnico

## 🔐 Seguridad

### Protección de Rutas

Las rutas están protegidas mediante:

1. **JwtAuthGuard**: Verifica token JWT válido
2. **RolesGuard**: Verifica roles requeridos
3. **PermissionsGuard**: Verifica permisos específicos

### Uso de Decoradores

```typescript
// Requerir autenticación
@UseGuards(JwtAuthGuard)

// Requerir rol específico
@Roles('admin', 'super_admin')
@UseGuards(JwtAuthGuard, RolesGuard)

// Requerir permiso específico
@RequirePermissions('users', 'create')
@UseGuards(JwtAuthGuard, PermissionsGuard)
```

---

⚡ **¡El sistema está listo para producción con todas las mejores prácticas de seguridad implementadas!**
