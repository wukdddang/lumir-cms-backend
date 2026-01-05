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
  process.env.SSO_BASE_URL =
    'https://lsso-git-dev-lumir-tech7s-projects.vercel.app';
  process.env.SSO_CLIENT_ID = 'cef8c785-d013-4f47-8780-84b3dac494f9';
  process.env.SSO_CLIENT_SECRET =
    '72970ccc55d3fd612ed78c667d1c94882281f64a4ae4be7cc0ac85149f90208b';
  // console.log(`✅ PostgreSQL 테스트 컨테이너가 시작되었습니다: ${databaseUrl}`);
}, 60000);

afterAll(async () => {
  if (postgresContainer) {
    // console.log('🛑 PostgreSQL 테스트 컨테이너를 종료합니다...');
    await postgresContainer.stop();
    console.log('✅ PostgreSQL 테스트 컨테이너가 종료되었습니다.');
  }
}, 30000);
