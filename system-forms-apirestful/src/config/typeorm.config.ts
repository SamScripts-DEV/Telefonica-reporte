import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: parseInt(configService.get('DB_PORT', '5432')),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASS'),
  database: configService.get('DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: false, 
  logging: configService.get('NODE_ENV') === 'development',
});
