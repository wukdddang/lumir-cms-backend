import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionManagerService } from './transaction-manager.service';

/**
 * 데이터베이스 모듈
 *
 * TypeORM을 사용하여 PostgreSQL 데이터베이스 연결을 관리합니다.
 */

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isTest = nodeEnv === 'test';
        const isDevelopment = nodeEnv === 'development';

        const host = configService.get<string>('DATABASE_HOST', 'localhost');
        const port = configService.get<number>('DATABASE_PORT', 5434);
        const username = configService.get<string>(
          'DATABASE_USERNAME',
          'lumir_admin',
        );
        const password = configService.get<string>(
          'DATABASE_PASSWORD',
          'lumir_password_2024',
        );
        const database = configService.get<string>(
          'DATABASE_NAME',
          'lumir_cms_management',
        );
        const needsSSL =
          configService.get<string>('DATABASE_SSL', 'false') === 'true';

        if (!host || !username || !database) {
          throw new Error(
            '데이터베이스 연결 정보가 누락되었습니다. ' +
              'DATABASE_HOST, DATABASE_USERNAME, DATABASE_NAME 환경 변수를 설정해주세요.',
          );
        }

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: configService.get<boolean>(
            'DB_SYNCHRONIZE',
            isDevelopment,
          ),
          logging: configService.get<boolean>(
            'DB_LOGGING',
            isDevelopment && !isTest,
          ),
          ssl: needsSSL ? { rejectUnauthorized: false } : false,
          extra: {
            max: configService.get<number>('DATABASE_POOL_MAX', 10),
            connectionTimeoutMillis: configService.get<number>(
              'DATABASE_CONNECTION_TIMEOUT',
              10000,
            ),
            idleTimeoutMillis: configService.get<number>(
              'DATABASE_IDLE_TIMEOUT',
              20000,
            ),
            statement_timeout: configService.get<number>(
              'DATABASE_STATEMENT_TIMEOUT',
              30000,
            ),
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
            ...(needsSSL && { ssl: { rejectUnauthorized: false } }),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [TransactionManagerService],
  exports: [TransactionManagerService, TypeOrmModule],
})
export class DatabaseModule {}
