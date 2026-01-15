# 권한 검증 스케줄러

이 문서는 위키와 공지사항의 권한 검증 스케줄러에 대한 설명입니다.

## 개요

SSO 시스템에서 부서나 직원 정보가 삭제될 경우, 위키와 공지사항에 매핑된 권한 정보가 무효화될 수 있습니다. 이를 자동으로 감지하고 로그를 남기기 위해 권한 검증 스케줄러가 매일 실행됩니다.

## 스케줄러 실행 시간

- **위키 권한 검증**: 매일 새벽 2시 (Cron: `0 2 * * *`)
- **공지사항 권한 검증**: 매일 새벽 3시 (Cron: `0 3 * * *`)

> **중복 로그 방지**: 이미 해결되지 않은 `DETECTED` 로그가 있으면 새로운 로그를 생성하지 않습니다.

## 수동 실행 API

관리자는 필요시 배치 작업을 즉시 실행할 수 있습니다.

### 엔드포인트

```
POST /admin/permission-validation/wiki         # 위키 권한 검증 즉시 실행
POST /admin/permission-validation/announcement # 공지사항 권한 검증 즉시 실행
POST /admin/permission-validation/all          # 모든 권한 검증 즉시 실행 (병렬)
```

### 응답 예시

```json
{
  "success": true,
  "message": "위키 권한 검증이 완료되었습니다.",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### 사용 예시 (cURL)

```bash
# 위키 권한 검증
curl -X POST http://localhost:3000/admin/permission-validation/wiki \
  -H "Authorization: Bearer {admin-token}"

# 공지사항 권한 검증
curl -X POST http://localhost:3000/admin/permission-validation/announcement \
  -H "Authorization: Bearer {admin-token}"

# 모든 권한 검증 (병렬)
curl -X POST http://localhost:3000/admin/permission-validation/all \
  -H "Authorization: Bearer {admin-token}"
```

## 구성 요소

### 1. SSO 서비스 (`src/domain/common/sso/`)

SSO API를 통해 부서와 직원 정보를 조회합니다.

**파일**:
- `sso.service.ts` - SSO 서비스 구현
- `sso.module.ts` - SSO 모듈

**주요 메서드**:
```typescript
// 개별 조회
부서_정보를_조회한다(departmentId: string): Promise<SsoDepartmentInfo | null>
직원_정보를_조회한다(employeeId: string): Promise<SsoEmployeeInfo | null>

// 일괄 조회 (병렬 처리)
부서_정보_목록을_조회한다(departmentIds: string[]): Promise<Map<string, SsoDepartmentInfo | null>>
직원_정보_목록을_조회한다(employeeIds: string[]): Promise<Map<string, SsoEmployeeInfo | null>>

// FCM 토큰 조회
FCM_토큰을_조회한다(params: { employeeNumbers?: string | string[]; employeeIds?: string | string[]; }): Promise<PortalFcmTokenInfo[]>
```

**SSO API 엔드포인트**:
- `GET /api/admin/organizations/departments/{id}` - 부서 상세 조회
- `GET /api/admin/organizations/employees/{id}` - 직원 상세 조회

**환경 변수**:
```env
SSO_BASE_URL=https://sso.example.com
```

### 2. 위키 권한 검증 스케줄러 (`src/context/wiki-context/wiki-permission.scheduler.ts`)

위키의 부서 권한을 검증하고 무효한 부서를 자동으로 제거합니다.

**동작 방식**:
1. 모든 위키 항목 조회 (매일 새벽 2시)
2. 각 위키의 `permissionDepartmentCodes` 검증
3. 이미 미해결 로그가 있는지 확인 (중복 방지)
4. SSO API를 통해 각 부서 ID 존재 여부 확인
5. 무효한 부서 발견 시:
   - 부서 ID와 이름(있다면) 함께 저장
   - `DETECTED` 로그 생성 (이전 부서 정보 스냅샷 포함)
   - 무효한 부서 제거
   - `REMOVED` 로그 생성
   - 관리자에게 알림
   - `NOTIFIED` 로그 생성

### 3. 공지사항 권한 검증 스케줄러 (`src/context/announcement-context/announcement-permission.scheduler.ts`)

공지사항의 부서/직원 권한을 검증하고 무효한 데이터를 자동으로 제거합니다.

**동작 방식**:
1. 모든 공지사항 조회 (매일 새벽 3시)
2. 각 공지사항의 `permissionDepartmentCodes`, `permissionEmployeeIds` 검증
3. 이미 미해결 로그가 있는지 확인 (중복 방지)
4. SSO API를 통해 각 부서/직원 ID 존재 여부 확인
5. 무효한 데이터 발견 시:
   - 부서/직원 ID와 이름(있다면) 함께 저장
   - `DETECTED` 로그 생성 (이전 정보 스냅샷 포함)
   - 무효한 데이터 제거
   - `REMOVED` 로그 생성
   - 관리자에게 알림
   - `NOTIFIED` 로그 생성

## 권한 로그 엔티티

### WikiPermissionLog

위키 권한 무효화 이력을 기록합니다.

**위치**: `src/domain/sub/wiki-file-system/wiki-permission-log.entity.ts`

**주요 필드**:
```typescript
{
  wikiFileSystemId: string;
  
  // 무효화된 부서 (ID와 이름)
  invalidDepartments: Array<{
    id: string;
    name: string | null;
  }> | null;
  
  // 권한 설정 스냅샷 (변경 전)
  snapshotPermissions: {
    permissionRankCodes: string[] | null;
    permissionPositionCodes: string[] | null;
    permissionDepartments: Array<{
      id: string;
      name: string | null;
    }> | null;
  };
  
  action: WikiPermissionAction;
  detectedAt: Date;
  resolvedAt: Date | null;
}
```

### AnnouncementPermissionLog

공지사항 권한 무효화 이력을 기록합니다.

**위치**: `src/domain/core/announcement/announcement-permission-log.entity.ts`

**주요 필드**:
```typescript
{
  announcementId: string;
  
  // 무효화된 부서 (ID와 이름)
  invalidDepartments: Array<{
    id: string;
    name: string | null;
  }> | null;
  
  // 무효화된 직원 (ID와 이름)
  invalidEmployees: Array<{
    id: string;
    name: string | null;
  }> | null;
  
  // 권한 설정 스냅샷 (변경 전)
  snapshotPermissions: {
    permissionRankCodes: string[] | null;
    permissionPositionCodes: string[] | null;
    permissionDepartments: Array<{
      id: string;
      name: string | null;
    }> | null;
    permissionEmployees: Array<{
      id: string;
      name: string | null;
    }> | null;
  };
  
  action: AnnouncementPermissionAction;
  detectedAt: Date;
  resolvedAt: Date | null;
}
```

## 로그 액션 타입

```typescript
enum PermissionAction {
  DETECTED = 'detected',   // 무효한 코드 감지됨
  REMOVED = 'removed',     // 무효한 코드 자동 제거됨
  NOTIFIED = 'notified',   // 관리자에게 통보됨
  RESOLVED = 'resolved',   // 관리자가 수동으로 해결함
}
```

## 프론트엔드 UI를 위한 데이터 구조

권한 로그에는 이전 부서/직원 정보와 무효화된 부서/직원 정보가 모두 포함되어 있어, 프론트엔드에서 "이전 부서 → 이후 부서" 형태로 표시할 수 있습니다.

**예시**:
```typescript
// 로그에서 가져온 데이터
const log = {
  snapshotPermissions: {
    permissionDepartments: [
      { id: 'DEPT_001', name: '개발팀' },
      { id: 'DEPT_002', name: '디자인팀' },
      { id: 'DEPT_999', name: '구 마케팅팀' }, // 삭제된 부서
    ],
  },
  invalidDepartments: [
    { id: 'DEPT_999', name: '구 마케팅팀' },
  ],
};

// 프론트엔드 표시
// 이전: 개발팀, 디자인팀, 구 마케팅팀
// 이후: 개발팀, 디자인팀
// 제거됨: 구 마케팅팀
```

## 모니터링

스케줄러 실행 로그는 애플리케이션 로그에 기록됩니다:

```
[WikiPermissionScheduler] 위키 권한 검증 스케줄러 시작
[WikiPermissionScheduler] 검증 대상 위키: 150개
[WikiPermissionScheduler] [알림] 위키 "개발팀 문서" (ID: xxx)의 부서 권한이 무효화되었습니다.
[WikiPermissionScheduler]   - 무효 부서: DEPT_OLD (구 마케팅팀)
[WikiPermissionScheduler] 위키 권한 검증 완료 - 처리: 150개, 무효 발견: 3개
```

## SSO API 연동

### 부서 조회 엔드포인트

**요청**:
```http
GET /api/admin/organizations/departments/{id}
```

**응답** (200 OK):
```json
{
  "id": "DEPT_001",
  "name": "개발팀",
  "parentId": "DEPT_ROOT",
  "depth": 1
}
```

**응답** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "부서를 찾을 수 없습니다"
}
```

### 직원 조회 엔드포인트

**요청**:
```http
GET /api/admin/organizations/employees/{id}
```

**응답** (200 OK):
```json
{
  "id": "emp001",
  "name": "홍길동",
  "email": "hong@example.com",
  "departmentId": "DEPT_001",
  "rankCode": "RANK_SENIOR",
  "positionCode": "POS_LEAD"
}
```

**응답** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "직원을 찾을 수 없습니다"
}
```

## 관리자 API (향후 구현 필요)

권한 로그를 조회하고 해결 상태로 업데이트하는 관리자 API:

```typescript
// GET /admin/wiki/:id/permission-logs
// 위키의 권한 로그 목록 조회
// 응답: { id, invalidDepartments, snapshotPermissions, action, detectedAt }[]

// PATCH /admin/wiki/permission-logs/:logId/resolve
// 권한 로그를 해결 상태로 변경
// 바디: { note?: string }

// GET /admin/announcements/:id/permission-logs
// 공지사항의 권한 로그 목록 조회

// PATCH /admin/announcements/permission-logs/:logId/resolve
// 권한 로그를 해결 상태로 변경
```

## 알림 시스템 (향후 구현 필요)

현재는 로그로만 출력되지만, 실제 알림 시스템을 구현할 수 있습니다:

- 이메일 알림
- 슬랙/디스코드 알림
- 시스템 내부 알림
- SMS 알림

## 테스트

스케줄러를 수동으로 테스트하려면:

```typescript
// 개발 환경에서 즉시 실행
await wikiPermissionScheduler.모든_위키_권한을_검증한다();
await announcementPermissionScheduler.모든_공지사항_권한을_검증한다();
```

## 문제 해결

### 스케줄러가 실행되지 않는 경우

1. `@nestjs/schedule` 패키지가 설치되어 있는지 확인
2. `app.module.ts`에서 `ScheduleModule.forRoot()` 설정 확인
3. 스케줄러가 모듈 providers에 등록되어 있는지 확인

### SSO API 연동 실패

1. `SSO_BASE_URL` 환경 변수 확인
2. SSO API 엔드포인트 경로 확인
3. 네트워크 연결 확인
4. SSO API 응답 타임아웃 (기본 5초)

### 로그가 생성되지 않는 경우

1. 위키/공지사항에 부서 권한이 설정되어 있는지 확인
2. SSO API에서 404 응답이 오는지 확인
3. 스케줄러 로그 확인

## 관련 문서

- [공지사항 권한 로그 가이드](./announcement-permission-log-guide.md)
- [위키 컨텍스트 플로우](./state-flow/context-flows/wiki-context-flow.md)
- [공지사항 컨텍스트 플로우](./state-flow/context-flows/announcement-context-flow.md)
