import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { TowersModule } from './modules/towers/towers.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { FormsModule } from './modules/forms/forms.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { GroupsModule } from './modules/groups/groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    TowersModule,
    TechniciansModule,
    FormsModule,
    PermissionsModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
