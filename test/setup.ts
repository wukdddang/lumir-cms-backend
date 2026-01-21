import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let postgresContainer: StartedPostgreSqlContainer;

beforeAll(async () => {
  console.log('🐳 PostgreSQL 테스트 컨테이너를 시작합니다...');

  postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('lumir_cms_test')
    .withUsername('test_user')
    .withPassword('test_password')
    .withExposedPorts(5432)
    .start();

  const databaseUrl = postgresContainer.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;

  // DATABASE_URL을 파싱하여 개별 환경 변수로 설정
  // postgresql://username:password@host:port/database 형식
  const url = new URL(databaseUrl);
  process.env.DATABASE_HOST = url.hostname;
  process.env.DATABASE_PORT = url.port || '5432';
  process.env.DATABASE_USERNAME = url.username;
  process.env.DATABASE_PASSWORD = url.password || '';
  process.env.DATABASE_NAME = url.pathname.replace('/', '');

  process.env.NODE_ENV = 'test';
  process.env.DB_SYNCHRONIZE = 'true';
  process.env.DB_LOGGING = 'false';
  process.env.LOG_LEVEL = 'silent';
  process.env.PORT = '4001';
  // 기본 언어를 한국어로 설정 (번역 동기화 테스트는 한국어 기준)
  process.env.DEFAULT_LANGUAGE_CODE = 'ko';
}, 60000);

afterAll(async () => {
  if (postgresContainer) {
    await postgresContainer.stop();
    console.log('✅ PostgreSQL 테스트 컨테이너가 종료되었습니다.');
  }
}, 30000);
