import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// .env 파일 로드
config();

/**
 * TypeORM 마이그레이션용 DataSource 설정
 *
 * 이 파일은 마이그레이션 생성 및 실행 시에만 사용됩니다.
 * 실제 애플리케이션은 database.module.ts의 설정을 사용합니다.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'admin',
  password: process.env.DATABASE_PASSWORD || 'tech7admin!',
  database: process.env.DATABASE_NAME || 'cms-db',
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  // 빌드된 JavaScript 파일 사용 (path alias 문제 해결)
  entities: ['dist/src/domain/**/*.entity.js', 'dist/libs/database/**/*.entity.js'],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false,
  logging: true,
});
