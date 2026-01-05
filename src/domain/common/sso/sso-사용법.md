NPM 경로

- https://www.npmjs.com/package/@lumir-company/sso-sdk
  GITHUB 경로
- https://github.com/GTD-web/backoffice-backend-sdk

# SSO SDK

사내 ERP SSO 서비스를 위한 TypeScript SDK입니다. NestJS와 Next.js 환경에서 사용할 수 있습니다.

## 설치

```bash
npm install @lumir-company/sso-sdk

# or

yarn add @lumir-company/sso-sdk

# or

pnpm add @lumir-company/sso-sdk
```

## 빠른 시작 (60초)

```typescript
import { SSOClient } from '@lumir-company/sso-sdk';

// 1. 클라이언트 초기화

const client = new SSOClient({
  baseUrl: 'https://lsso.vercel.app', // 또는 개발 서버 URL

  clientId: process.env.SSO_CLIENT_ID!,

  clientSecret: process.env.SSO_CLIENT_SECRET!,
});

// 2. 시스템 인증 (자동으로 X-System-Name 헤더 설정)

await client.initialize();

// 3. 로그인

const result = await client.sso.login('user@example.com', 'password123');

console.log('로그인 성공:', result.name);

console.log('Access Token:', result.accessToken);
```

## 주요 기능

- ✅ **TypeScript 완전 지원**: 타입 안정성과 자동완성
- ✅ **자동 재시도**: 네트워크 오류 시 지수 백오프
- ✅ **에러 핸들링**: 표준화된 에러 타입
- ✅ **타임아웃 제어**: AbortController 기반
- ✅ **인증 방식**: API Key
- ✅ **Node.js & 브라우저 호환**

## 인증 방식

### Basic Auth (시스템 인증)

SDK는 초기화 시 `clientId`와 `clientSecret`으로 Basic Auth를 사용하여 시스템 인증을 수행합니다.

```typescript
const client = new SSOClient({
  baseUrl: 'https://lsso.vercel.app',

  clientId: 'your-client-id',

  clientSecret: 'your-client-secret',
});

// 시스템 인증 수행

await client.initialize();
```

### 서버 환경별 URL

```typescript
// 개발 서버

const devClient = new SSOClient({
  baseUrl: 'https://lsso-git-dev-lumir-tech7s-projects.vercel.app',

  clientId: process.env.SSO_CLIENT_ID!,

  clientSecret: process.env.SSO_CLIENT_SECRET!,
});

// 실서버

const prodClient = new SSOClient({
  baseUrl: 'https://lsso.vercel.app',

  clientId: process.env.SSO_CLIENT_ID!,

  clientSecret: process.env.SSO_CLIENT_SECRET!,
});
```

## Next.js에서 사용

```typescript
// app/api/auth/login/route.ts

import { SSOClient } from '@lumir-company/sso-sdk';

export async function POST(request: Request) {
  const client = new SSOClient({
    baseUrl: process.env.SSO_BASE_URL!,

    clientId: process.env.SSO_CLIENT_ID!,

    clientSecret: process.env.SSO_CLIENT_SECRET!,
  }); // 시스템 인증

  await client.initialize();
  const { email, password } = await request.json();

  try {
    const result = await client.sso.login(email, password); // 쿠키 설정

    return Response.json(
      { success: true, user: result },

      {
        headers: {
          'Set-Cookie': `accessToken=${result.accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/`,
        },
      },
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },

      { status: 401 },
    );
  }
}

// app/api/auth/verify/route.ts

export async function POST(request: Request) {
  const client = new SSOClient({
    baseUrl: process.env.SSO_BASE_URL!,

    clientId: process.env.SSO_CLIENT_ID!,

    clientSecret: process.env.SSO_CLIENT_SECRET!,
  });

  await client.initialize();

  const { token } = await request.json();

  const result = await client.sso.verifyToken(token);

  return Response.json(result);
}
```

## NestJS에서 사용

```typescript
// sso.module.ts

import { Module } from '@nestjs/common';

import { SSOClient } from '@lumir-company/sso-sdk';

@Module({
  providers: [
    {
      provide: 'SSO_CLIENT',

      useFactory: async () => {
        const client = new SSOClient({
          baseUrl: process.env.SSO_BASE_URL!,

          clientId: process.env.SSO_CLIENT_ID!,

          clientSecret: process.env.SSO_CLIENT_SECRET!,
        }); // 시스템 인증

        await client.initialize();

        return client;
      },
    },
  ],

  exports: ['SSO_CLIENT'],
})
export class SSOModule {}

// auth.service.ts

import { Injectable, Inject } from '@nestjs/common';

import { SSOClient } from '@lumir-company/sso-sdk';

@Injectable()
export class AuthService {
  constructor(@Inject('SSO_CLIENT') private ssoClient: SSOClient) {}

  async login(email: string, password: string) {
    return this.ssoClient.sso.login(email, password);
  }

  async verifyToken(token: string) {
    return this.ssoClient.sso.verifyToken(token);
  }

  async refreshToken(refreshToken: string) {
    return this.ssoClient.sso.refreshToken(refreshToken);
  }
}
```

## 주요 API

### 로그인 & 인증

```typescript
// 로그인

const loginResult = await client.sso.login('user@example.com', 'password123');

// 토큰 검증

const verifyResult = await client.sso.verifyToken(accessToken);

// 토큰 갱신

const refreshResult = await client.sso.refreshToken(refreshToken);
```

### 비밀번호 관리

```typescript
// 비밀번호 확인

const checkResult = await client.sso.checkPassword(
  accessToken,

  'currentPassword',

  'user@example.com',
);

// 비밀번호 변경

const changeResult = await client.sso.changePassword(
  accessToken,

  'newPassword456',
);
```

### 조직 정보 조회

```typescript
// 직원 정보 조회 (사번 또는 ID로)

const employee = await client.organization.getEmployee({
  employeeNumber: 'E2023001',

  withDetail: true, // 부서, 직책, 직급 포함
});

// 여러 직원 정보 조회

const employees = await client.organization.getEmployees({
  identifiers: ['E2023001', 'E2023002'], // 생략 시 전체 조회

  withDetail: true,

  includeTerminated: false, // 퇴사자 제외
});

// 부서 계층구조 조회

const hierarchy = await client.organization.getDepartmentHierarchy({
  rootDepartmentId: 'dept-123', // 특정 부서부터 시작 (생략 시 전체)

  maxDepth: 3, // 최대 깊이

  withEmployeeDetail: true, // 직원 상세 정보 포함

  includeEmptyDepartments: true, // 빈 부서 포함
});

console.log('부서 수:', hierarchy.totalDepartments);

console.log('직원 수:', hierarchy.totalEmployees);

hierarchy.departments.forEach((dept) => {
  console.log(`${dept.departmentName}: ${dept.employeeCount}명`);
});
```

### FCM 토큰 관리

```typescript
// FCM 토큰 구독 (앱 로그인 시)

const subscribeResult = await client.fcm.subscribe({
  employeeNumber: 'E2023001',

  fcmToken: 'device-fcm-token-from-firebase',

  deviceType: 'android', // 'android', 'ios', 'pc', 'web'
});

console.log('FCM 토큰 등록:', subscribeResult.fcmToken);

// FCM 토큰 조회

const tokenInfo = await client.fcm.getToken({
  employeeNumber: 'E2023001',
});

console.log('토큰 개수:', tokenInfo.tokens.length);

tokenInfo.tokens.forEach((token) => {
  console.log(`- ${token.deviceType}: ${token.fcmToken}`);

  console.log('  생성일:', token.createdAt);
});

// 여러 직원의 FCM 토큰 조회 (알림서버용)

const multipleTokens = await client.fcm.getMultipleTokens({
  employeeNumbers: ['E2023001', 'E2023002', 'E2023003'],
});

console.log(
  `총 ${multipleTokens.totalEmployees}명, ${multipleTokens.totalTokens}개 토큰`,
);

// 직원별로 처리

multipleTokens.byEmployee.forEach((emp) => {
  console.log(`${emp.employeeNumber}: ${emp.tokens.length}개 토큰`);
});

// 또는 flat하게 모든 토큰에 접근

const allFcmTokens = multipleTokens.allTokens.map((t) => t.fcmToken);

console.log('모든 FCM 토큰:', allFcmTokens);

// FCM 토큰 구독 해지 (앱 로그아웃 시 - 모든 토큰 해지)

const unsubscribeResult = await client.fcm.unsubscribe({
  employeeNumber: 'E2023001',
});

console.log('FCM 토큰 해지:', unsubscribeResult);
```

## 에러 핸들링

```typescript
import { ApiError, AuthenticationError } from '@lumir-company/sso-sdk';

try {
  const result = await client.sso.login('user@example.com', 'wrongpassword');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('인증 실패:', error.message);
  } else if (error instanceof ApiError) {
    console.error('API 에러:', {
      status: error.status,

      code: error.code,

      message: error.message,

      requestId: error.requestId,
    });
  }
}
```

## 설정 옵션

```typescript
const client = new SSOClient({
  baseUrl: 'https://lsso.vercel.app', // 필수: API 서버 URL

  clientId: 'your-client-id', // 필수: 시스템 클라이언트 ID

  clientSecret: 'your-client-secret', // 필수: 시스템 클라이언트 Secret

  systemName: 'MyApp', // 선택: 수동으로 설정 (initialize() 건너뛰기)

  timeoutMs: 10000, // 선택: 타임아웃 (기본값: 10초)

  retries: 3, // 선택: 재시도 횟수 (기본값: 3)

  retryDelay: 200, // 선택: 재시도 지연 (기본값: 200ms)

  enableLogging: false, // 선택: 로깅 활성화 (기본값: false)

  fetchImpl: customFetch, // 선택: 커스텀 fetch (테스트용)
});
```

## 환경 변수 설정

`.env` 파일:

```bash
SSO_BASE_URL=https://lsso.vercel.app

SSO_CLIENT_ID=your-client-id

SSO_CLIENT_SECRET=your-client-secret
```

## 개발

```bash
# 의존성 설치

npm install

# 개발 모드 (watch)

npm run dev

# 빌드

npm run build

# 테스트

npm test                # 모든 테스트 실행

npm run test:unit       # 단위 테스트만 실행

npm run test:integration # 통합 테스트 실행 (환경 변수 필요)

npm run test:coverage   # 커버리지 포함

# 린트

npm run lint

npm run lint:fix        # 자동 수정

# 타입 체크

npm run type-check
```

## 테스트

### 단위 테스트

Mock을 사용한 테스트 (환경 변수 불필요):

```bash
npm run test:unit
```

### 통합 테스트

실제 개발 서버 API 테스트 (환경 변수 필요):

```bash
# 환경 변수 설정

export SSO_CLIENT_ID=221f2815-c772-4d21-a657-6457d5732b61

export SSO_CLIENT_SECRET=df30bb8aa82f2d42e124af0dbe358dd0a02ef5067052367a99ef8524ae8b0f56

# 통합 테스트 실행

npm run test:integration
```

자세한 내용은 [test/README.md](test/README.md)를 참고하세요.
