# SSO 모듈

사내 ERP SSO 서비스를 위한 도메인 모듈입니다. `@lumir-company/sso-sdk`를 래핑하여 DDD 원칙에 맞게 설계되었습니다.

## 구조

```
sso/
├── interfaces/                   # 인터페이스 정의
│   ├── sso-client.interface.ts   # SSO 클라이언트 인터페이스
│   ├── sso-auth.interface.ts     # 인증 관련 인터페이스
│   ├── sso-organization.interface.ts # 조직 정보 조회 인터페이스
│   ├── sso-fcm.interface.ts      # FCM 토큰 관리 인터페이스
│   └── index.ts
├── sso-client.wrapper.ts         # SSO SDK 래퍼 구현체
├── sso.service.ts                # SSO 서비스 (파사드)
├── sso.module.ts                 # SSO 모듈
├── sso-client.wrapper.spec.ts    # 래퍼 유닛 테스트
├── sso.service.spec.ts           # 서비스 유닛 테스트
├── sso.integration.spec.ts       # 통합 테스트 (실제 서버)
└── index.ts
```

## 환경 변수 설정

`.env` 파일에 다음 환경 변수를 추가하세요:

```bash
# 필수
SSO_BASE_URL=https://lsso.vercel.app  # 또는 개발 서버 URL
SSO_CLIENT_ID=cef8c785-d013-4f47-8780-84b3dac494f9
SSO_CLIENT_SECRET=72970ccc55d3fd612ed78c667d1c94882281f64a4ae4be7cc0ac85149f90208b

# 선택 (기본값 사용 가능)
SSO_SYSTEM_NAME=EMS-PROD  # 시스템 이름 (기본값: EMS-PROD)
SSO_TIMEOUT_MS=30000  # 타임아웃 (기본값: 30000ms = 30초, Vercel Pro 플랜 권장)
SSO_RETRIES=2  # 재시도 횟수 (기본값: 2회)
SSO_RETRY_DELAY=1000  # 재시도 지연 (기본값: 1000ms = 1초)
SSO_ENABLE_LOGGING=false
```

### 시스템 역할 검증

로그인 시 `SSO_SYSTEM_NAME`에 설정된 시스템의 역할을 자동으로 검증합니다:

- **`EMS-PROD`** 시스템 역할이 없거나 빈 배열인 경우 → `403 Forbidden` 에러 발생
- 이를 통해 권한이 없는 사용자의 로그인을 차단합니다
- 시스템 이름은 환경 변수로 변경 가능합니다 (기본값: `EMS-PROD`)

### 서버 환경별 URL

- **개발 서버**: `https://lsso-git-dev-lumir-tech7s-projects.vercel.app`
- **실서버**: `https://lsso.vercel.app`

## 테스트

### 유닛 테스트 (모킹)

```bash
# SSO 래퍼 테스트
npm test -- sso-client.wrapper.spec.ts

# SSO 서비스 테스트
npm test -- sso.service.spec.ts

# 전체 SSO 유닛 테스트
npm test -- src/domain/common/sso
```

### 통합 테스트 (실제 서버)

실제 SSO 서버와 연동하여 테스트합니다:

```bash
# 환경 변수가 .env 파일에 설정되어 있어야 합니다
npm test -- sso.integration.spec.ts
```

**통합 테스트 내용:**

- ✅ 시스템 인증 확인
- ✅ 직원 정보 조회 (전체/개별)
- ✅ 부서 계층구조 조회
- ✅ 에러 처리 확인
- ⏭️ 로그인/토큰 검증 (수동 테스트용, skip)

**주의:** 로그인 및 토큰 검증 테스트는 실제 사용자 계정이 필요하므로 `.skip`으로 표시되어 있습니다. 수동으로 테스트하려면 테스트 파일에서 `.skip`을 제거하고 실제 계정 정보를 입력하세요.

## 사용법

### 1. 기본 사용 (Service 주입)

```typescript
import { Injectable } from '@nestjs/common';
import { SSOService } from '@domain/common/sso';

@Injectable()
export class AuthService {
  constructor(private readonly ssoService: SSOService) {}

  async login(email: string, password: string) {
    try {
      const result = await this.ssoService.로그인한다(email, password);
      return {
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          employeeNumber: result.employeeNumber,
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('로그인 실패');
    }
  }

  async verifyToken(accessToken: string) {
    const result = await this.ssoService.토큰을검증한다(accessToken);
    if (!result.valid) {
      throw new UnauthorizedException('유효하지 않은 토큰');
    }
    return result;
  }
}
```

### 2. 인증 관련 메서드

```typescript
// 로그인
// ⚠️ 주의: EMS-PROD 시스템 역할이 없으면 ForbiddenException 발생
try {
  const loginResult = await ssoService.로그인한다(
    'user@example.com',
    'password123',
  );
  console.log('사용자:', loginResult.name);
  console.log('사번:', loginResult.employeeNumber);
  console.log('시스템 역할:', loginResult.systemRoles);
  // 예: { "EMS-PROD": ["admin", "user"], "RMS-PROD": ["resourceManager"] }
} catch (error) {
  if (error instanceof ForbiddenException) {
    // EMS-PROD 시스템 역할이 없는 경우
    console.error('접근 권한이 없습니다:', error.message);
  }
  throw error;
}

// 토큰 검증
// ⚠️ 주의: valid가 false이면 UnauthorizedException 발생
try {
  const verifyResult = await ssoService.토큰을검증한다(accessToken);
  // 검증 성공 시 사용자 정보 사용
  console.log('사용자 ID:', verifyResult.id);
  console.log('이메일:', verifyResult.email);
  console.log('이름:', verifyResult.name);
  console.log('사번:', verifyResult.employeeNumber);
} catch (error) {
  if (error instanceof UnauthorizedException) {
    // 유효하지 않은 토큰
    console.error('토큰 검증 실패:', error.message);
  }
  throw error;
}

// ⚠️ 중요: 토큰 검증 결과에는 역할(role) 정보가 포함되지 않습니다
// 역할 정보는 로그인 시에만 제공되며, JWT 토큰에는 포함되지 않습니다
// 역할 정보가 필요한 경우:
// 1. 로그인 시 systemRoles를 애플리케이션 DB에 저장
// 2. 토큰 검증 후 employeeNumber로 DB에서 역할 조회
// 3. 또는 직원 정보 조회 API를 추가로 호출

// 토큰 갱신
const refreshResult = await ssoService.토큰을갱신한다(refreshToken);

// 비밀번호 확인
const checkResult = await ssoService.비밀번호를확인한다(
  accessToken,
  'currentPassword',
  'user@example.com',
);

// 비밀번호 변경
const changeResult = await ssoService.비밀번호를변경한다(
  accessToken,
  'newPassword456',
);
```

### 3. 조직 정보 조회

```typescript
// 직원 정보 조회 (사번)
const employee = await ssoService.직원정보를조회한다({
  employeeNumber: 'E2023001',
  withDetail: true, // 부서, 직책, 직급 포함
});

// 편의 메서드: 사번으로 조회
const employee2 = await ssoService.사번으로직원을조회한다('E2023001');

// 여러 직원 정보 조회
const employees = await ssoService.여러직원정보를조회한다({
  identifiers: ['E2023001', 'E2023002'],
  withDetail: true,
  includeTerminated: false, // 퇴사자 제외
});

// 편의 메서드: 여러 사번으로 조회
const employees2 = await ssoService.여러사번으로직원을조회한다([
  'E2023001',
  'E2023002',
]);

// 부서 계층구조 조회
const hierarchy = await ssoService.부서계층구조를조회한다({
  rootDepartmentId: 'dept-123', // 특정 부서부터 시작 (생략 시 전체)
  maxDepth: 3, // 최대 깊이
  withEmployeeDetail: true,
  includeEmptyDepartments: true,
});

console.log(`부서 수: ${hierarchy.totalDepartments}명`);
console.log(`직원 수: ${hierarchy.totalEmployees}명`);
```

### 4. FCM 토큰 관리

```typescript
// FCM 토큰 구독 (앱 로그인 시)
const subscribeResult = await ssoService.FCM토큰을구독한다({
  employeeNumber: 'E2023001',
  fcmToken: 'device-fcm-token-from-firebase',
  deviceType: 'android', // 'android', 'ios', 'pc', 'web'
});

// FCM 토큰 조회
const tokenInfo = await ssoService.FCM토큰을조회한다({
  employeeNumber: 'E2023001',
});

console.log(`토큰 개수: ${tokenInfo.tokens.length}`);
tokenInfo.tokens.forEach((token) => {
  console.log(`- ${token.deviceType}: ${token.fcmToken}`);
});

// 여러 직원의 FCM 토큰 조회 (알림 서버용)
const multipleTokens = await ssoService.여러직원의FCM토큰을조회한다({
  employeeNumbers: ['E2023001', 'E2023002', 'E2023003'],
});

// 직원별로 처리
multipleTokens.byEmployee.forEach((emp) => {
  console.log(`${emp.employeeNumber}: ${emp.tokens.length}개 토큰`);
});

// 또는 flat하게 모든 토큰 접근
const allFcmTokens = multipleTokens.allTokens.map((t) => t.fcmToken);

// FCM 토큰 구독 해지 (앱 로그아웃 시)
const unsubscribeResult = await ssoService.FCM토큰을구독해지한다({
  employeeNumber: 'E2023001',
});
```

## 주요 인터페이스

### ISSOClient

전체 SSO 클라이언트 인터페이스

```typescript
interface ISSOClient {
  초기화한다(): Promise<void>;
  readonly auth: ISSOAuthService;
  readonly organization: ISSOOrganizationService;
  readonly fcm: ISSOfcmService;
}
```

### ISSOAuthService

인증 관련 서비스

- `로그인한다(email, password)`
- `토큰을검증한다(accessToken)`
- `토큰을갱신한다(refreshToken)`
- `비밀번호를확인한다(accessToken, password, email)`
- `비밀번호를변경한다(accessToken, newPassword)`

### ISSOOrganizationService

조직 정보 조회 서비스

- `직원정보를조회한다(params)`
- `여러직원정보를조회한다(params)`
- `부서계층구조를조회한다(params?)`

### ISSOfcmService

FCM 토큰 관리 서비스

- `FCM토큰을구독한다(params)`
- `FCM토큰을구독해지한다(params)`
- `FCM토큰을조회한다(params)`
- `여러직원의FCM토큰을조회한다(params)`

## 역할(Role) 관리 전략

### SSO의 역할 정보 구조

SSO 서비스는 다음과 같은 역할 정보 제공 방식을 가지고 있습니다:

#### 1. 로그인 시 (`LoginResult`)

```typescript
{
  id: "user-id",
  email: "user@example.com",
  name: "홍길동",
  employeeNumber: "E2023001",
  accessToken: "jwt-token...",
  refreshToken: "refresh-token...",
  systemRoles: {
    "RMS-PROD": ["resourceManager", "systemAdmin"],
    "OTHER-SYSTEM": ["viewer"]
  }
}
```

- `systemRoles`: 시스템별 역할 목록
- 로그인 시에만 제공됨

#### 2. 토큰 검증 시 (`VerifyTokenResult`)

```typescript
{
  valid: true,
  id: "user-id",
  email: "user@example.com",
  name: "홍길동",
  employeeNumber: "E2023001"
  // ❌ systemRoles 필드 없음
}
```

- JWT 토큰에는 역할 정보가 포함되지 않음
- 기본 사용자 정보만 반환

### 권장 전략

애플리케이션에서 역할 기반 접근 제어(RBAC)가 필요한 경우, 다음 전략 중 하나를 선택하세요:

#### 전략 1: 애플리케이션 DB 관리 (권장)

```typescript
// 1. 로그인 시 역할 정보를 DB에 저장
async login(email: string, password: string) {
  const ssoResult = await this.ssoService.로그인한다(email, password);

  // 로컬 DB에 사용자 및 역할 저장/업데이트
  await this.userRepository.upsert({
    id: ssoResult.id,
    employeeNumber: ssoResult.employeeNumber,
    email: ssoResult.email,
    name: ssoResult.name,
  });

  // 역할 정보 저장 (예: RMS-PROD 시스템의 역할만 추출)
  const appRoles = ssoResult.systemRoles?.['RMS-PROD'] || [];
  await this.userRoleRepository.syncRoles(ssoResult.id, appRoles);

  return { ...ssoResult, roles: appRoles };
}

// 2. 토큰 검증 시 DB에서 역할 조회
async validateToken(token: string) {
  const verifyResult = await this.ssoService.토큰을검증한다(token);

  if (!verifyResult.valid) {
    throw new UnauthorizedException();
  }

  // DB에서 역할 조회
  const roles = await this.userRoleRepository.findRolesByUserId(verifyResult.id);

  return { ...verifyResult, roles };
}
```

**장점:**

- 빠른 역할 조회 (DB 캐싱 가능)
- SSO 서버 부하 감소
- 오프라인 동작 가능
- 애플리케이션별 커스텀 역할 추가 가능

**단점:**

- 역할 변경 시 동기화 필요
- 저장 공간 필요

#### 전략 2: 매 요청마다 직원 정보 조회

```typescript
async validateToken(token: string) {
  const verifyResult = await this.ssoService.토큰을검증한다(token);

  if (!verifyResult.valid) {
    throw new UnauthorizedException();
  }

  // 추가로 직원 정보 조회하여 역할 확인
  // (단, 현재 SSO 조직 API에는 역할 정보가 없을 수 있음)
  const employeeInfo = await this.ssoService.직원정보를조회한다({
    employeeNumber: verifyResult.employeeNumber,
    withDetail: true,
  });

  return { ...verifyResult, department: employeeInfo.department };
}
```

**장점:**

- 항상 최신 정보
- 저장 공간 불필요

**단점:**

- 매 요청마다 추가 API 호출
- SSO 서버 부하 증가
- 응답 시간 증가

#### 전략 3: 속성 기반 매핑 (ABAC)

```typescript
// 부서, 직책, 직급 등의 속성으로 역할 자동 부여
async getRolesByAttributes(employeeInfo: EmployeeInfo): Promise<string[]> {
  const roles: string[] = ['user']; // 기본 역할

  // 부서별 역할
  if (employeeInfo.department?.departmentCode === 'DEPT001') {
    roles.push('hr-manager');
  }

  // 직책별 역할
  if (employeeInfo.position?.positionName === '파트장') {
    roles.push('team-leader');
  }

  // 직급별 역할
  if (employeeInfo.jobTitle?.jobTitleName === '부장') {
    roles.push('senior-manager');
  }

  return roles;
}
```

**장점:**

- 동적 역할 부여
- SSO의 조직 정보 활용
- 역할 동기화 불필요

**단점:**

- 복잡한 매핑 로직 필요
- 속성 변경 시 즉시 반영 (의도치 않을 수 있음)

### 구현 예시: JwtAuthGuard에 역할 추가

```typescript
// src/interface/guards/jwt-auth.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<Request>();
  const token = this.extractTokenFromHeader(request);

  if (!token) {
    throw new UnauthorizedException('인증 토큰이 필요합니다.');
  }

  const verifyResult = await this.ssoService.토큰을검증한다(token);

  if (!verifyResult.valid) {
    throw new UnauthorizedException('유효하지 않은 토큰입니다.');
  }

  // DB에서 역할 조회 (전략 1)
  const roles = await this.userRoleRepository.findRolesByUserId(verifyResult.id);

  // Request에 사용자 정보 및 역할 주입
  request['user'] = {
    id: verifyResult.id,
    email: verifyResult.email,
    name: verifyResult.name,
    employeeNumber: verifyResult.employeeNumber,
    roles, // 역할 추가
  };

  return true;
}
```

## 에러 핸들링

SSO SDK의 에러가 그대로 전파됩니다. 비즈니스 로직에서 적절히 처리하세요.

```typescript
import { ApiError, AuthenticationError } from '@lumir-company/sso-sdk';

try {
  const result = await ssoService.로그인한다(
    'user@example.com',
    'wrongpassword',
  );
} catch (error) {
  if (error instanceof AuthenticationError) {
    throw new UnauthorizedException('인증 실패');
  } else if (error instanceof ApiError) {
    throw new InternalServerErrorException('SSO 서비스 오류');
  }
}
```

## 테스트 작성 가이드

SSO 모듈은 인터페이스 기반으로 설계되어 있어 쉽게 모킹할 수 있습니다.

```typescript
const mockSSOService = {
  로그인한다: jest.fn(),
  토큰을검증한다: jest.fn(),
  직원정보를조회한다: jest.fn(),
  // ...
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    AuthService,
    {
      provide: SSOService,
      useValue: mockSSOService,
    },
  ],
}).compile();
```

## 의존성

- `@lumir-company/sso-sdk`: SSO SDK 패키지
- `@nestjs/common`: NestJS 공통 모듈
- `@nestjs/config`: 환경 변수 관리

## 참고 자료

- [SSO SDK NPM](https://www.npmjs.com/package/@lumir-company/sso-sdk)
- [SSO SDK GitHub](https://github.com/GTD-web/backoffice-backend-sdk)
- [sso-사용법.md](./sso-사용법.md): 상세 사용 가이드
