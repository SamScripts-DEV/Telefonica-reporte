# Sistema de Formularios - Encuestas

## Requisitos
- Docker
- Docker Compose
- Git

## Instalación en VM

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd <nombre-del-proyecto>
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus valores específicos
```

### 3. Levantar los servicios
```bash
docker-compose up -d
```

### 4. Verificar que todo funciona
- Base de datos: `localhost:5434`
- PgAdmin: `http://localhost:8085`
- API: `http://localhost:3000` (cuando implementes la aplicación)

## Servicios

### PostgreSQL
- Puerto: 5434
- Base de datos: Se inicializa automáticamente con `db/init.sql`

### PgAdmin
- Puerto: 8085
- Usuario: Configurado en `.env`

## Comandos útiles

```bash
# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Limpiar todo (¡cuidado! elimina datos)
docker-compose down -v
```

## Estructura del proyecto
```
├── docker-compose.yml          # Configuración de contenedores
├── db/
│   └── init.sql               # Script de inicialización de BD
├── system-forms-apirestful/   # API Backend (NestJS)
└── system-forms-view/         # Frontend
```
