# Sistema de Encuestas de Satisfacción Técnica - API RESTful

Una API RESTful segura, modular, auditable y escalable para gestionar encuestas de satisfacción técnica en una organización con múltiples roles y torres de servicio.

## 🏗️ Arquitectura

### Módulos Principales

- **Users**: Gestión de usuarios, roles y asignación a torres
- **Roles**: Sistema de roles con permisos granulares
- **Towers**: Gestión de torres de servicio
- **Forms**: Creación y gestión de formularios con preguntas dinámicas
- **Technicians**: Gestión de técnicos sin acceso al sistema
- **Submissions**: Gestión de respuestas a formularios
- **Auth**: Autenticación JWT y autorización

### Roles del Sistema

- **dev/superadmin**: Acceso completo al sistema
- **pm**: PM de Sonda, acceso solo a sus torres asignadas
- **jefe**: Jefe de Telefónica, acceso solo a torres que lidera
- **evaluador**: Solo ve y responde encuestas, asigna técnicos a formularios
- **tecnico**: No entra al sistema, solo es evaluado

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 12+
- npm o yarn

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya está configurado con:

```env
DB_HOST=localhost
DB_PORT=5434
DB_NAME=sistema_encuestas_satisfaccion
DB_USER=admin
DB_PASS=zabbix
JWT_SECRET=supersecretekrngoierngioneiorngoerk
JWT_EXPIRES_IN=1d
```

### 3. Configurar base de datos

Ejecuta el script SQL para crear la base de datos y las tablas:

```bash
psql -U admin -h localhost -p 5434 -f db/init.sql
```

### 4. Poblar datos iniciales

```bash
npm run seed
```

Este comando creará:
- Roles básicos del sistema
- Torres de ejemplo
- Usuarios de prueba:
  - Admin: `admin@telefonica.com` / `admin123`
  - PM: `pm@telefonica.com` / `pm123`
  - Evaluador: `evaluador@telefonica.com` / `eval123`

### 5. Ejecutar la aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

La API estará disponible en `http://localhost:3000`

## 📚 Endpoints Principales

### Autenticación

```bash
POST /auth/login
```

### Usuarios

```bash
GET    /users              # Listar usuarios
POST   /users              # Crear usuario
GET    /users/:id          # Obtener usuario
PATCH  /users/:id          # Actualizar usuario
DELETE /users/:id          # Deshabilitar usuario
PATCH  /users/:id/towers   # Asignar torres a usuario
```

### Roles

```bash
GET    /roles              # Listar roles
POST   /roles              # Crear rol
GET    /roles/:id          # Obtener rol
PATCH  /roles/:id          # Actualizar rol
DELETE /roles/:id          # Eliminar rol
```

### Torres

```bash
GET    /towers             # Listar torres
POST   /towers             # Crear torre
GET    /towers/:id         # Obtener torre
PATCH  /towers/:id         # Actualizar torre
DELETE /towers/:id         # Eliminar torre
```

### Técnicos

```bash
GET    /technicians        # Listar técnicos
POST   /technicians        # Crear técnico
GET    /technicians/:id    # Obtener técnico
PATCH  /technicians/:id    # Actualizar técnico
DELETE /technicians/:id    # Eliminar técnico
GET    /technicians/tower/:id # Técnicos por torre
```

### Formularios

```bash
GET    /forms              # Listar formularios
POST   /forms              # Crear formulario
GET    /forms/:id          # Obtener formulario
PATCH  /forms/:id          # Actualizar formulario
DELETE /forms/:id          # Eliminar formulario
POST   /forms/:id/submit   # Enviar respuesta
GET    /forms/:id/responses # Obtener respuestas
PATCH  /forms/:id/status   # Cambiar estado
```

## 🔐 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración configurable
- **Hash de contraseñas**: bcrypt para encriptación robusta
- **Guards de autorización**: Control granular basado en roles
- **Filtrado por torres**: Acceso limitado según asignaciones
- **Validación de datos**: class-validator para entrada segura

## 📖 Auditoría

- Registro de cambios en formularios y preguntas
- Historial de modificaciones por usuario
- Logs de acciones críticas
- Respuestas inmutables una vez enviadas

## 🛠️ Desarrollo

### Estructura del Proyecto

```
src/
├── common/           # Utilidades compartidas
│   ├── decorators/   # Decoradores personalizados
│   ├── dto/          # DTOs comunes
│   ├── guards/       # Guards de seguridad
│   └── interfaces/   # Interfaces TypeScript
├── config/           # Configuraciones
├── entities/         # Entidades de TypeORM
├── modules/          # Módulos de funcionalidad
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── towers/
│   ├── technicians/
│   └── forms/
└── seeds/           # Scripts de inicialización
```

### Scripts Disponibles

```bash
npm run start:dev     # Desarrollo con hot reload
npm run build         # Compilar para producción
npm run test          # Ejecutar tests
npm run lint          # Lint del código
npm run seed          # Poblar datos iniciales
```

## 📋 Características Implementadas

- ✅ Autenticación y autorización completa
- ✅ Gestión de usuarios y roles
- ✅ Sistema de torres con acceso granular
- ✅ Formularios dinámicos con múltiples tipos de preguntas
- ✅ Gestión de técnicos y evaluadores
- ✅ Sistema de respuestas con validaciones
- ✅ Paginación en todos los endpoints
- ✅ Filtrado por permisos de torre
- ✅ Validación robusta de datos
- ✅ Estructura modular y escalable

## 🔄 Próximas Funcionalidades

- [ ] Sistema de auditoría completo
- [ ] Reportes y analytics
- [ ] Notificaciones en tiempo real
- [ ] Exportación de datos
- [ ] API de webhooks
- [ ] Dashboard administrativo

## 🚦 Cómo Probar la API

1. **Iniciar la aplicación**:
   ```bash
   npm run start:dev
   ```

2. **Hacer login**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@telefonica.com", "password": "admin123"}'
   ```

3. **Usar el token** en las siguientes peticiones:
   ```bash
   curl -X GET http://localhost:3000/users \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
