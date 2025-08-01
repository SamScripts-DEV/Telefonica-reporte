import { DataSource } from 'typeorm';
import { getTypeOrmConfig } from '../config/typeorm.config';
import { ConfigService } from '@nestjs/config';
import { seedDatabase } from './seed';

class MockConfigService extends ConfigService {
  get(key: string, defaultValue?: any): any {
    const envVars = {
      DB_HOST: 'localhost',
      DB_PORT: '5434',
      DB_USER: 'admin',
      DB_PASS: 'zabbix',
      DB_NAME: 'sistema_encuestas_satisfaccion',
      NODE_ENV: 'development'
    };
    return envVars[key] || defaultValue;
  }
}

async function runSeed() {
  const configService = new MockConfigService();
  const config = getTypeOrmConfig(configService);
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: parseInt(configService.get('DB_PORT', '5432')),
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASS'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');
    
    await seedDatabase(dataSource);
    
    await dataSource.destroy();
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();
