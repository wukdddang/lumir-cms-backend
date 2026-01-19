# 권한 검증 스케줄러

이 문서는 위키와 공지사항의 권한 검증 스케줄러에 대한 설명입니다.

## 개요

SSO 시스템에서 부서나 직원 정보가 비활성화(`isActive=false`)될 경우, 위키와 공지사항에 매핑된 권한 정보가 무효화될 수 있습니다. 권한 검증 스케줄러가 매일 실행되어 이를 자동으로 감지하고 로그를 남깁니다.

**중요 정책**:
1. 스케줄러는 무효한 권한을 **자동으로 제거하지 않습니다**
2. **위키**: 부서 권한만 검증
3. **공지사항**: 부서 권한만 검증 (직원 권한은 검증하지 않음)
4. `permissionDepartmentIds` 중 **하나라도** `isActive=false`인 부서가 있으면 로그 생성
5. **SSO에서 조회 실패한 경우(404 등)는 로그에 기록하지 않습니다** (시드 데이터 등 임시 ID 고려)
6. **부서가 다시 활성화(`isActive: true`)되면 로그가 자동으로 해결(`RESOLVED`)됩니다**
7. **로그는 영구 보관**되며 삭제되지 않습니다 (해결된 로그도 보관)
8. 관리자가 로그를 확인하고 **수동으로 부서 ID를 교체**해야 합니다
9. ID 교체 시 `RESOLVED` 로그가 추가로 생성됩니다

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
// 개별 조회 (isActive: false인 정보도 반환, 존재하지 않으면 null)
부서_정보를_조회한다(departmentId: string): Promise<SsoDepartmentInfo | null>
직원_정보를_조회한다(employeeId: string): Promise<SsoEmployeeInfo | null>

// 일괄 조회 (SSO API 일괄 조회 엔드포인트 사용)
// - isActive: false인 정보도 반환 (스케줄러에서 구분 가능하도록)
// - 존재하지 않는 ID는 null로 반환
부서_정보_목록을_조회한다(departmentIds: string[]): Promise<Map<string, SsoDepartmentInfo | null>>
직원_정보_목록을_조회한다(employeeIds: string[]): Promise<Map<string, SsoEmployeeInfo | null>>

// FCM 토큰 조회
FCM_토큰을_조회한다(params: { employeeNumbers?: string | string[]; employeeIds?: string | string[]; }): Promise<PortalFcmTokenInfo[]>
```

**SSO API 엔드포인트**:
- `GET /api/admin/organizations/departments/{id}` - 부서 상세 조회
- `POST /api/admin/organizations/departments/list` - 부서 목록 일괄 조회
- `GET /api/admin/organizations/employees/{id}` - 직원 상세 조회
- `POST /api/admin/organizations/employees/list` - 직원 목록 일괄 조회

**환경 변수**:
```env
SSO_BASE_URL=https://sso.example.com
```

### 2. 위키 권한 검증 스케줄러 (`src/context/wiki-context/wiki-permission.scheduler.ts`)

위키의 부서 권한을 검증하고 비활성화된 부서를 감지합니다.

**동작 방식**:
1. 모든 위키 항목 조회 (매일 새벽 2시)
2. 각 위키의 `permissionDepartmentIds` 검증
3. **기존 미해결 로그 재검증**: 로그에 있는 부서가 다시 활성화되었는지 확인
   - 모든 부서가 `isActive: true`로 복구되었다면 로그를 자동으로 `RESOLVED` 처리
4. SSO API를 통해 각 부서 ID의 활성화 상태(`isActive`) 확인
   - **SSO에서 조회 실패(404 등)**: 로그에 기록하지 않음 (시드 데이터 등 임시 ID 고려)
   - **SSO에서 조회 성공, `isActive=false`**: 로그에 기록
5. **하나라도** `isActive=false`인 부서가 있으면:
   - 이미 미해결 로그가 있는지 확인 (중복 방지)
   - 비활성 부서 ID와 이름을 `invalidDepartments`에 저장
   - 전체 부서 정보를 `snapshotPermissions`에 스냅샷으로 저장
   - `DETECTED` 로그를 `wiki_permission_logs` 테이블에 영구 저장
   - 관리자에게 알림 전송

**권한 교체는 관리자가 수동으로 처리**:
1. `GET /admin/wiki/:id/permission-logs`로 로그 조회
2. 어떤 부서 ID로 교체할지 결정
3. `PATCH /admin/wiki/:id/replace-permissions`로 부서 ID 교체
4. 시스템이 자동으로 `RESOLVED` 로그 생성 (기존 `DETECTED` 로그는 유지됨)

### 3. 공지사항 권한 검증 스케줄러 (`src/context/announcement-context/announcement-permission.scheduler.ts`)

공지사항의 부서 권한을 검증하고 비활성화된 부서를 감지합니다.

**중요**: 공지사항은 **부서 권한만** 검증하며, 직원 권한(`permissionEmployeeIds`)은 검증하지 않습니다.

**동작 방식**:
1. 모든 공지사항 조회 (매일 새벽 3시)
2. 각 공지사항의 `permissionDepartmentIds` 검증 (직원은 검증 안 함)
3. **기존 미해결 로그 재검증**: 로그에 있는 부서가 다시 활성화되었는지 확인
   - 모든 부서가 `isActive: true`로 복구되었다면 로그를 자동으로 `RESOLVED` 처리
4. SSO API를 통해 각 부서 ID의 활성화 상태(`isActive`) 확인
   - **SSO에서 조회 실패(404 등)**: 로그에 기록하지 않음 (시드 데이터 등 임시 ID 고려)
   - **SSO에서 조회 성공, `isActive=false`**: 로그에 기록
5. **하나라도** `isActive=false`인 부서가 있으면:
   - 이미 미해결 로그가 있는지 확인 (중복 방지)
   - 비활성 부서 ID와 이름을 `invalidDepartments`에 저장
   - 전체 권한 정보를 `snapshotPermissions`에 스냅샷으로 저장
   - `DETECTED` 로그를 `announcement_permission_logs` 테이블에 영구 저장
   - 관리자에게 알림 전송

**권한 교체는 관리자가 수동으로 처리**:
1. `GET /admin/announcements/permission-logs`로 로그 조회
2. 어떤 부서 ID로 교체할지 결정
3. `PATCH /admin/announcements/:id/replace-permissions`로 부서 ID 교체
4. 시스템이 자동으로 `RESOLVED` 로그 생성 (기존 `DETECTED` 로그는 유지됨)

## 권한 로그 엔티티

**중요**: 권한 로그는 **영구 보관**되며 삭제되지 않습니다. 이는 다음과 같은 이유 때문입니다:
- 권한 변경 이력 추적
- 감사(Audit) 목적
- 문제 발생 시 원인 분석
- 복구 시 참고 자료

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
  DETECTED = 'detected',   // 무효한 코드 감지됨 (스케줄러가 자동 생성)
  RESOLVED = 'resolved',   // 해결됨 (관리자 교체 또는 부서 재활성화)
}
```

### `RESOLVED` 로그 생성 시나리오

1. **관리자가 수동으로 권한 교체**:
   - `resolvedBy`: 관리자 사용자 ID
   - `note`: "구 마케팅팀을 신 마케팅팀으로 교체" (사용자 입력)

2. **부서가 다시 활성화되어 자동 해결**:
   - `resolvedBy`: `"system"`
   - `note`: `"부서가 다시 활성화되어 자동으로 해결됨"`

### 로그 생성 정책

1. **DETECTED 로그**:
   - 스케줄러가 자동 생성
   - `permissionDepartmentIds` 중 **하나라도** `isActive=false`이면 생성
   - 중복 방지: 같은 항목에 미해결 `DETECTED` 로그가 있으면 새로 생성하지 않음
   - **영구 보관**: 해결 후에도 삭제되지 않음

2. **RESOLVED 로그**:
   - 관리자가 부서/직원 ID 교체 시 자동 생성
   - 어떤 ID를 어떻게 교체했는지 `note`에 기록
   - 기존 `DETECTED` 로그와 함께 보관됨

**참고**: 이전 버전에서 사용하던 `REMOVED`, `NOTIFIED` 액션은 더 이상 사용하지 않습니다.

## 권한 교체 프로세스

### 1. 스케줄러가 비활성 부서 감지 및 재활성화 확인
- 매일 새벽에 자동 실행
- **먼저 기존 미해결 로그를 재검증**: 로그에 있는 부서가 다시 활성화되었는지 확인
  - 모든 부서가 `isActive: true`로 복구되었다면 로그를 자동으로 `RESOLVED` 처리
  - `resolvedBy: "system"`, `note: "부서가 다시 활성화되어 자동으로 해결됨"`
- `permissionDepartmentIds` 중 **하나라도** `isActive=false`이면 새 로그 생성
- **공지사항은 부서만 검증** (직원은 검증하지 않음)
- `DETECTED` 로그를 `permission_logs` 테이블에 저장 (영구 보관)
- 관리자에게 알림

### 2. 관리자가 로그 확인

#### 전체 미해결 로그 조회
```http
GET /admin/announcements/permission-logs?resolved=false
```

**응답 예시**:
```json
[
  {
    "id": "log-123",
    "announcementId": "announce-456",
    "invalidDepartments": [
      { "id": "DEPT_OLD", "name": "구 마케팅팀" }
    ],
    "snapshotPermissions": {
      "permissionDepartments": [
        { "id": "DEPT_001", "name": "개발팀" },
        { "id": "DEPT_OLD", "name": "구 마케팅팀" }
      ]
    },
    "action": "detected",
    "detectedAt": "2026-01-15T03:00:00Z",
    "resolvedAt": null,
    "announcement": {
      "id": "announce-456",
      "title": "2026년 1분기 공지사항"
    }
  },
  {
    "id": "log-124",
    "announcementId": "announce-457",
    "invalidDepartments": [
      { "id": "DEPT_999", "name": null }
    ],
    "action": "detected",
    "detectedAt": "2026-01-15T03:00:01Z",
    "resolvedAt": null,
    "announcement": {
      "id": "announce-457",
      "title": "긴급 공지"
    }
  }
]
```

**중요**: 
- 전체 조회이므로 여러 공지사항/위키의 로그가 함께 조회됩니다
- `announcement` 또는 `wikiFileSystem` 관계가 포함되어 어떤 항목인지 확인할 수 있습니다
- 미해결 로그만 보려면 `?resolved=false` 파라미터를 사용합니다

### 3. 관리자가 부서 ID 교체
```http
PATCH /admin/announcements/announce-456/replace-permissions

{
  "departments": [
    { "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }
  ],
  "note": "구 마케팅팀을 신 마케팅팀으로 교체"
}
```

**중요**: 
- 이 API는 공지사항의 `permissionDepartmentIds`를 직접 수정합니다
- 여러 부서 ID를 한 번에 교체할 수 있습니다
- `oldId`가 실제로 존재하는 경우에만 교체됩니다

### 4. 시스템이 자동으로 RESOLVED 로그 생성
- 공지사항의 `permissionDepartmentIds` 업데이트
- 새로운 `RESOLVED` 로그 생성 (기존 `DETECTED` 로그는 유지됨)
- 교체 내역이 `note`에 기록됨

### 5. (선택) 로그를 수동으로 해결 처리
API를 사용하지 않고 직접 DB를 수정한 경우:
```http
PATCH /admin/announcements/permission-logs/log-123/resolve

{
  "note": "DB에서 직접 수정 완료"
}
```

## 중요 정책 요약

### 로그 관리
1. **영구 보관**: 모든 `permission_logs` 데이터는 삭제되지 않습니다
2. **중복 방지**: 같은 항목에 미해결 `DETECTED` 로그가 있으면 새로 생성하지 않습니다
3. **이력 추적**: `DETECTED`와 `RESOLVED` 로그가 함께 보관되어 변경 이력을 추적할 수 있습니다

### 감지 기준
- `permissionDepartmentIds` 또는 `permissionEmployeeIds` 중 **하나라도** `isActive=false`인 경우 감지
- 404(존재하지 않음)와 `isActive=false`(비활성)를 동일하게 처리

### 권한 교체
- 스케줄러는 **절대 자동으로 권한을 제거하지 않습니다**
- 관리자가 로그를 확인하고 어떤 부서/직원으로 교체할지 **수동으로 결정**해야 합니다
- 교체 API를 사용하면 `RESOLVED` 로그가 자동 생성됩니다

### 데이터 보존
- 원본 권한 정보는 `snapshotPermissions`에 스냅샷으로 저장
- 비활성화된 부서/직원 정보는 `invalidDepartments`/`invalidEmployees`에 저장
- 문제 발생 시 이 데이터를 참고하여 복구 가능

## 모니터링

스케줄러 실행 로그는 애플리케이션 로그에 기록됩니다:

```
[WikiPermissionScheduler] 위키 권한 검증 스케줄러 시작
[WikiPermissionScheduler] 검증 대상 위키: 150개
[WikiPermissionScheduler] [알림] 위키 "개발팀 문서" (ID: xxx)에서 비활성화된 부서가 발견되었습니다.
[WikiPermissionScheduler]   → 관리자가 수동으로 부서 ID를 교체해야 합니다.
[WikiPermissionScheduler]   - 비활성 부서: DEPT_OLD (구 마케팅팀)
[WikiPermissionScheduler] 위키 권한 검증 완료 - 처리: 150개, 무효 발견: 3개
```

### 권한 로그 테이블 확인

```sql
-- 미해결 위키 권한 로그 (공지사항 정보 포함)
SELECT 
  wpl.id,
  wpl.wiki_file_system_id,
  wfs.name as wiki_name,
  wpl.invalid_departments,
  wpl.action,
  wpl.detected_at,
  wpl.resolved_at
FROM wiki_permission_logs wpl
LEFT JOIN wiki_file_system wfs ON wpl.wiki_file_system_id = wfs.id
WHERE wpl.resolved_at IS NULL 
ORDER BY wpl.detected_at DESC;

-- 미해결 공지사항 권한 로그 (공지사항 정보 포함)
SELECT 
  apl.id,
  apl.announcement_id,
  a.title as announcement_title,
  apl.invalid_departments,
  apl.invalid_employees,
  apl.action,
  apl.detected_at,
  apl.resolved_at
FROM announcement_permission_logs apl
LEFT JOIN announcement a ON apl.announcement_id = a.id
WHERE apl.resolved_at IS NULL 
ORDER BY apl.detected_at DESC;

-- 해결된 로그 포함 전체 이력 (최근 30일)
SELECT 
  wpl.*,
  wfs.name as wiki_name
FROM wiki_permission_logs wpl
LEFT JOIN wiki_file_system wfs ON wpl.wiki_file_system_id = wfs.id
WHERE wpl.detected_at >= NOW() - INTERVAL '30 days'
ORDER BY wpl.detected_at DESC;

-- 통계 쿼리: 미해결 건수
SELECT 
  'wiki' as type,
  COUNT(*) as unresolved_count
FROM wiki_permission_logs 
WHERE resolved_at IS NULL
UNION ALL
SELECT 
  'announcement' as type,
  COUNT(*) as unresolved_count
FROM announcement_permission_logs 
WHERE resolved_at IS NULL;
```

## SSO API 연동

### 부서 조회 엔드포인트

#### 1. 개별 조회
**요청**:
```http
GET /api/admin/organizations/departments/{id}
```

**응답** (200 OK - 활성 상태):
```json
{
  "id": "DEPT_001",
  "name": "개발팀",
  "parentId": "DEPT_ROOT",
  "depth": 1,
  "isActive": true
}
```

**응답** (200 OK - 비활성 상태):
```json
{
  "id": "DEPT_OLD",
  "name": "구 마케팅팀",
  "parentId": "DEPT_ROOT",
  "depth": 1,
  "isActive": false
}
```
> **참고**: `isActive`가 `false`인 경우 스케줄러가 무효로 판단하고 로그에 기록합니다. SSO 서비스는 `isActive: false`인 정보도 반환하며, 스케줄러에서 이를 구분하여 처리합니다.

**응답** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "부서를 찾을 수 없습니다"
}
```

#### 2. 일괄 조회 (권장)
**요청**:
```http
POST /api/admin/organizations/departments/list
Content-Type: application/json

{
  "departmentIds": ["DEPT_001", "DEPT_002", "DEPT_OLD"]
}
```

**응답** (200 OK):
```json
[
  {
    "id": "DEPT_001",
    "name": "개발팀",
    "parentId": "DEPT_ROOT",
    "depth": 1,
    "isActive": true
  },
  {
    "id": "DEPT_002",
    "name": "디자인팀",
    "parentId": "DEPT_ROOT",
    "depth": 1,
    "isActive": true
  },
  {
    "id": "DEPT_OLD",
    "name": "구 마케팅팀",
    "parentId": "DEPT_ROOT",
    "depth": 1,
    "isActive": false
  }
]
```

**참고**:
- 존재하지 않는 부서 ID는 응답에 포함되지 않음
- 권한 검증 스케줄러는 이 일괄 조회 API를 사용하여 성능 최적화
- 일괄 조회 실패 시 자동으로 개별 조회로 폴백

### 직원 조회 엔드포인트

#### 1. 개별 조회
**요청**:
```http
GET /api/admin/organizations/employees/{id}
```

**응답** (200 OK - 활성 상태):
```json
{
  "id": "emp001",
  "name": "홍길동",
  "email": "hong@example.com",
  "departmentId": "DEPT_001",
  "rankCode": "RANK_SENIOR",
  "positionCode": "POS_LEAD",
  "isActive": true
}
```
> **참고**: `isActive`가 `false`인 경우 스케줄러가 무효로 판단합니다.

**응답** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "직원을 찾을 수 없습니다"
}
```

#### 2. 일괄 조회 (권장)
**요청**:
```http
POST /api/admin/organizations/employees/list
Content-Type: application/json

{
  "employeeIds": ["emp001", "emp002", "emp003"]
}
```

**응답** (200 OK):
```json
[
  {
    "id": "emp001",
    "name": "홍길동",
    "email": "hong@example.com",
    "departmentId": "DEPT_001",
    "rankCode": "RANK_SENIOR",
    "positionCode": "POS_LEAD",
    "isActive": true
  },
  {
    "id": "emp002",
    "name": "김철수",
    "email": "kim@example.com",
    "departmentId": "DEPT_002",
    "rankCode": "RANK_JUNIOR",
    "positionCode": "POS_MEMBER",
    "isActive": false
  }
]
```

**참고**:
- 존재하지 않는 직원 ID는 응답에 포함되지 않음 (스케줄러는 이를 로그에 기록하지 않음)
- `isActive: false`인 직원도 응답에 포함됨 (스케줄러는 이를 로그에 기록)
- 권한 검증 스케줄러는 이 일괄 조회 API를 사용하여 성능 최적화
- 일괄 조회 실패 시 자동으로 개별 조회로 폴백

## 관리자 API

권한 로그를 조회하고 부서 ID를 교체하는 관리자 API가 제공됩니다.

### 공지사항 권한 관리

#### 1. 권한 로그 전체 조회
```http
GET /admin/announcements/permission-logs
GET /admin/announcements/permission-logs?resolved=false  # 미해결만
GET /admin/announcements/permission-logs?resolved=true   # 해결됨만
```

모든 공지사항의 비활성화된 부서 목록을 조회합니다. (직원은 추적하지 않음)

**쿼리 파라미터**:
- `resolved`: 해결 여부 필터 (true: 해결됨, false: 미해결, 미지정: 전체)

**응답 예시**:
```json
[
  {
    "id": "log-123",
    "announcementId": "announce-456",
    "invalidDepartments": [{ "id": "DEPT_OLD", "name": "구 마케팅팀" }],
    "invalidEmployees": null,
    "action": "detected",
    "detectedAt": "2026-01-15T03:00:00Z",
    "resolvedAt": null,
    "announcement": {
      "id": "announce-456",
      "title": "공지사항 제목"
    }
  }
]
```

#### 2. 권한 ID 교체
```http
PATCH /admin/announcements/:id/replace-permissions
Content-Type: application/json

{
  "departments": [
    { "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }
  ],
  "note": "구 마케팅팀을 신 마케팅팀으로 교체"
}
```

#### 3. 로그 해결 처리
```http
PATCH /admin/announcements/permission-logs/:logId/resolve
Content-Type: application/json

{
  "note": "수동으로 해결 완료"
}
```

### 위키 권한 관리

#### 1. 권한 로그 전체 조회
```http
GET /admin/wiki/permission-logs
GET /admin/wiki/permission-logs?resolved=false  # 미해결만
GET /admin/wiki/permission-logs?resolved=true   # 해결됨만
```

모든 위키의 비활성화된 부서 목록을 조회합니다.

**쿼리 파라미터**:
- `resolved`: 해결 여부 필터 (true: 해결됨, false: 미해결, 미지정: 전체)

**응답 예시**:
```json
[
  {
    "id": "log-456",
    "wikiFileSystemId": "wiki-789",
    "invalidDepartments": [{ "id": "DEPT_OLD", "name": "구 마케팅팀" }],
    "action": "detected",
    "detectedAt": "2026-01-15T02:00:00Z",
    "resolvedAt": null,
    "wikiFileSystem": {
      "id": "wiki-789",
      "name": "개발 문서"
    }
  }
]
```

#### 2. 권한 ID 교체
```http
PATCH /admin/wiki/:id/replace-permissions
Content-Type: application/json

{
  "departments": [
    { "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }
  ],
  "note": "구 마케팅팀을 신 마케팅팀으로 교체"
}
```

#### 3. 로그 해결 처리
```http
PATCH /admin/wiki/permission-logs/:logId/resolve
Content-Type: application/json

{
  "note": "수동으로 해결 완료"
}
```

## 알림 시스템 (향후 구현 필요)

현재는 로그로만 출력되지만, 실제 알림 시스템을 구현할 수 있습니다:

- 이메일 알림
- 슬랙/디스코드 알림
- 시스템 내부 알림
- SMS 알림

## 시나리오 예시

### 시나리오 1: 부서가 비활성화된 경우

1. **초기 상태**: 공지사항 A가 마케팅팀(DEPT_MKT, `isActive: true`) 권한 설정
2. **부서 비활성화**: SSO에서 마케팅팀을 `isActive: false`로 변경
3. **스케줄러 실행** (다음 날 새벽 3시):
   - 마케팅팀이 비활성 상태임을 감지
   - `DETECTED` 로그 생성
   - 관리자에게 알림 전송
4. **관리자 확인**: `/admin/announcements/permission-logs?resolved=false` 조회
5. **관리자 처리**: 
   - 옵션 A: `/admin/announcements/:id/replace-permissions`로 새 부서로 교체
   - 옵션 B: SSO에서 부서를 다시 활성화하고 다음 스케줄러 실행 대기

### 시나리오 2: 부서가 다시 활성화된 경우

1. **초기 상태**: 공지사항 A에 대한 미해결 `DETECTED` 로그 존재 (마케팅팀 비활성)
2. **부서 재활성화**: SSO에서 마케팅팀을 `isActive: true`로 변경
3. **스케줄러 실행** (다음 날 새벽 3시):
   - 기존 미해결 로그 재검증
   - 마케팅팀이 활성 상태임을 확인
   - 로그를 자동으로 `RESOLVED` 처리 (`resolvedBy: "system"`)
   - 로그 메시지: "부서가 다시 활성화되어 자동으로 해결됨"
4. **결과**: 관리자가 별도 조치 없이 자동으로 해결됨

### 시나리오 3: 부서 통폐합 (수동 교체 필요)

1. **초기 상태**: 공지사항 A가 구마케팅팀(DEPT_OLD, `isActive: true`) 권한 설정
2. **부서 통폐합**: SSO에서 구마케팅팀을 비활성화하고 신마케팅팀 생성
3. **스케줄러 실행**:
   - 구마케팅팀이 비활성 상태임을 감지
   - `DETECTED` 로그 생성
4. **관리자 처리**:
   ```http
   PATCH /admin/announcements/123/replace-permissions
   {
     "departments": [
       { "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }
     ],
     "note": "구마케팅팀을 신마케팅팀으로 교체"
   }
   ```
5. **결과**: `RESOLVED` 로그 생성 (`resolvedBy: 관리자ID`)

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
