# 권한 검증 스케줄러 가이드

## 개요

SSO 시스템에서 부서 정보가 비활성화(`isActive=false`)될 경우, 위키와 공지사항에 매핑된 권한 정보가 무효화될 수 있습니다. 권한 검증 스케줄러가 매일 자동으로 실행되어 이를 감지하고 로그를 남깁니다.

## 핵심 정책

1. **자동 제거하지 않음**: 스케줄러는 무효한 권한을 자동으로 제거하지 않고, 로그만 남깁니다
2. **부서 권한만 검증**: 위키와 공지사항 모두 부서 권한만 검증합니다 (직원/직급/직책 권한은 검증하지 않음)
3. **SSO 조회 실패 무시**: SSO에서 404 등으로 조회 실패한 경우는 로그에 기록하지 않습니다 (시드 데이터 등 임시 ID 고려)
4. **isActive=false만 기록**: SSO에서 조회는 성공했지만 `isActive=false`인 부서만 로그에 기록합니다
5. **자동 해결**: 부서가 다시 활성화(`isActive: true`)되면 로그가 자동으로 해결(`RESOLVED`)됩니다
6. **수동 교체**: 관리자가 로그를 확인하고 수동으로 부서 ID를 교체해야 합니다
7. **영구 보관**: 로그는 영구 보관되며 삭제되지 않습니다

## 스케줄러 실행

### 자동 실행
- **위키 권한 검증**: 매일 새벽 2시 (Cron: `0 2 * * *`)
- **공지사항 권한 검증**: 매일 새벽 3시 (Cron: `0 3 * * *`)

### 수동 실행 API

관리자는 필요시 스케줄러를 즉시 실행할 수 있습니다.

```http
POST /admin/permission-validation/wiki         # 위키 권한 검증
POST /admin/permission-validation/announcement # 공지사항 권한 검증
POST /admin/permission-validation/all          # 모든 권한 검증 (병렬)
```

**응답 예시**:
```json
{
  "success": true,
  "message": "위키 권한 검증이 완료되었습니다.",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

**사용 예시**:
```bash
# 위키 권한 검증
curl -X POST http://localhost:3000/admin/permission-validation/wiki \
  -H "Authorization: Bearer {admin-token}"

# 모든 권한 검증
curl -X POST http://localhost:3000/admin/permission-validation/all \
  -H "Authorization: Bearer {admin-token}"
```

## 스케줄러 동작 방식

### 1. 위키 권한 검증 (`WikiPermissionScheduler`)

**파일**: `src/context/wiki-context/wiki-permission.scheduler.ts`

**동작 흐름**:
1. 모든 위키 항목 조회 (Soft Delete되지 않은 것만)
2. **기존 미해결 로그 재검증**: 로그에 있는 부서가 다시 활성화되었는지 확인
   - 모든 부서가 `isActive: true`로 복구되었다면 로그를 자동으로 `RESOLVED` 처리
3. 각 위키의 `permissionDepartmentIds` 검증:
   - SSO API를 통해 부서 정보 일괄 조회
   - **조회 실패(404 등)**: 로그에 기록하지 않음
   - **조회 성공, `isActive=false`**: 로그에 기록
4. **하나라도** `isActive=false`인 부서가 있으면:
   - 이미 미해결 로그가 있는지 확인 (중복 방지)
   - 비활성 부서 ID와 이름을 `invalidDepartments`에 저장
   - 전체 부서 정보를 `snapshotPermissions`에 스냅샷으로 저장
   - `DETECTED` 로그를 `wiki_permission_logs` 테이블에 저장
   - 관리자에게 알림 전송 (현재는 로그만 출력)

### 2. 공지사항 권한 검증 (`AnnouncementPermissionScheduler`)

**파일**: `src/context/announcement-context/announcement-permission.scheduler.ts`

**동작 흐름**:
위키 권한 검증과 동일하며, `announcement_permission_logs` 테이블에 로그를 저장합니다.

**중요**: 공지사항도 **부서 권한만** 검증하며, 직원 권한(`permissionEmployeeIds`)은 검증하지 않습니다.

### 중복 로그 방지

이미 해결되지 않은 `DETECTED` 로그가 있으면 새로운 로그를 생성하지 않습니다.

## 권한 로그 엔티티

### WikiPermissionLog

**위치**: `src/domain/sub/wiki-file-system/wiki-permission-log.entity.ts`

**주요 필드**:
```typescript
{
  wikiFileSystemId: string;
  invalidDepartments: Array<{ id: string; name: string | null }> | null;
  snapshotPermissions: {
    permissionRankIds: string[] | null;
    permissionPositionIds: string[] | null;
    permissionDepartments: Array<{ id: string; name: string | null }> | null;
  };
  action: WikiPermissionAction; // DETECTED | RESOLVED
  note: string | null;
  detectedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}
```

### AnnouncementPermissionLog

**위치**: `src/domain/core/announcement/announcement-permission-log.entity.ts`

**주요 필드**:
```typescript
{
  announcementId: string;
  invalidDepartments: Array<{ id: string; name: string | null }> | null;
  invalidEmployees: Array<{ id: string; name: string | null }> | null; // 현재 사용 안 함
  snapshotPermissions: {
    permissionRankIds: string[] | null;
    permissionPositionIds: string[] | null;
    permissionDepartments: Array<{ id: string; name: string | null }> | null;
    permissionEmployees: Array<{ id: string; name: string | null }> | null;
  };
  action: AnnouncementPermissionAction; // DETECTED | RESOLVED
  note: string | null;
  detectedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}
```

## 로그 액션 타입

```typescript
enum PermissionAction {
  DETECTED = 'detected',   // 무효한 부서 감지됨 (스케줄러가 자동 생성)
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

## 권한 교체 프로세스

### 1. 스케줄러가 비활성 부서 감지
- 매일 새벽에 자동 실행
- **먼저 기존 미해결 로그 재검증**: 부서가 다시 활성화되었는지 확인
  - 모든 부서가 `isActive: true`로 복구되었다면 자동으로 `RESOLVED` 처리
- `permissionDepartmentIds` 중 **하나라도** `isActive=false`이면 새 로그 생성
- `DETECTED` 로그를 `permission_logs` 테이블에 저장 (영구 보관)

### 2. 관리자가 로그 조회

#### 전체 미해결 로그 조회
```http
GET /admin/announcements/permission-logs?resolved=false
GET /admin/wiki/permission-logs?resolved=false
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
  }
]
```

### 3. 관리자가 부서 ID 교체 (로그 자동 해결)

```http
PATCH /admin/announcements/:id/replace-permissions

{
  "departments": [
    { "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }
  ],
  "note": "구 마케팅팀을 신 마케팅팀으로 교체"
}
```

**중요**: 
- 이 API는 공지사항/위키의 `permissionDepartmentIds`를 직접 수정합니다
- 여러 부서 ID를 한 번에 교체할 수 있습니다
- `oldId`가 실제로 존재하는 경우에만 교체됩니다
- **권한 교체와 동시에 자동으로 `RESOLVED` 로그가 생성됩니다** (기존 `DETECTED` 로그는 유지됨)
- 교체 내역이 `note`에 자동으로 기록됩니다

## SSO 서비스 연동

### SsoService

**위치**: `src/domain/common/sso/sso.service.ts`

**주요 메서드**:
```typescript
// 일괄 조회 (권장)
// - isActive: false인 정보도 반환
// - 존재하지 않는 ID는 null로 반환
부서_정보_목록을_조회한다(departmentIds: string[]): Promise<Map<string, SsoDepartmentInfo | null>>

// 개별 조회
// - isActive: false인 정보도 반환
// - 존재하지 않으면 null 반환
부서_정보를_조회한다(departmentId: string): Promise<SsoDepartmentInfo | null>
```

**SSO API 엔드포인트**:
- `GET /api/admin/organizations/departments/{id}` - 부서 상세 조회
- `POST /api/admin/organizations/departments/list` - 부서 목록 일괄 조회

**환경 변수**:
```env
SSO_BASE_URL=https://sso.example.com
```

## 관리자 API

### 공지사항 권한 관리

```http
# 권한 로그 전체 조회
GET /admin/announcements/permission-logs?resolved=false

# 권한 ID 교체 및 로그 자동 해결
PATCH /admin/announcements/:id/replace-permissions
{
  "departments": [{ "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }],
  "note": "구 마케팅팀을 신 마케팅팀으로 교체"
}
```

**참고**: 권한 ID 교체 API를 호출하면 자동으로 `RESOLVED` 로그가 생성되므로, 별도의 로그 해결 처리 API는 필요하지 않습니다.

### 위키 권한 관리

```http
# 권한 로그 전체 조회
GET /admin/wiki/permission-logs?resolved=false

# 권한 ID 교체 및 로그 자동 해결
PATCH /admin/wiki/:id/replace-permissions
{
  "departments": [{ "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }],
  "note": "구 마케팅팀을 신 마케팅팀으로 교체"
}
```

**참고**: 권한 ID 교체 API를 호출하면 자동으로 `RESOLVED` 로그가 생성되므로, 별도의 로그 해결 처리 API는 필요하지 않습니다.

## 시나리오 예시

### 시나리오 1: 부서가 비활성화된 경우

1. **초기 상태**: 공지사항 A가 마케팅팀(DEPT_MKT, `isActive: true`) 권한 설정
2. **부서 비활성화**: SSO에서 마케팅팀을 `isActive: false`로 변경
3. **스케줄러 실행** (다음 날 새벽 3시):
   - 마케팅팀이 비활성 상태임을 감지
   - `DETECTED` 로그 생성
   - 관리자에게 알림 전송 (현재는 로그만 출력)
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
4. **결과**: 관리자가 별도 조치 없이 자동으로 해결됨

### 시나리오 3: 부서 통폐합 (수동 교체 필요)

1. **초기 상태**: 공지사항 A가 구마케팅팀(DEPT_OLD, `isActive: true`) 권한 설정
2. **부서 통폐합**: SSO에서 구마케팅팀을 비활성화하고 신마케팅팀 생성
3. **스케줄러 실행**: 구마케팅팀이 비활성 상태임을 감지, `DETECTED` 로그 생성
4. **관리자 처리** (권한 교체와 로그 해결이 동시에 처리됨):
   ```http
   PATCH /admin/announcements/123/replace-permissions
   {
     "departments": [{ "oldId": "DEPT_OLD", "newId": "DEPT_NEW" }],
     "note": "구마케팅팀을 신마케팅팀으로 교체"
   }
   ```
5. **결과**: 
   - 공지사항의 `permissionDepartmentIds` 업데이트
   - 자동으로 `RESOLVED` 로그 생성 (`resolvedBy: 관리자ID`)

## 모니터링

### 애플리케이션 로그

```
[WikiPermissionScheduler] 위키 권한 검증 스케줄러 시작
[WikiPermissionScheduler] 검증 대상 위키: 150개
[WikiPermissionScheduler] [알림] 위키 "개발팀 문서" (ID: xxx)에서 비활성화된 부서가 발견되었습니다.
[WikiPermissionScheduler]   → 관리자가 수동으로 부서 ID를 교체해야 합니다.
[WikiPermissionScheduler]   - 비활성 부서: DEPT_OLD (구 마케팅팀)
[WikiPermissionScheduler] 위키 권한 검증 완료 - 처리: 150개, 무효 발견: 3개
```

### 데이터베이스 쿼리

```sql
-- 미해결 위키 권한 로그
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

-- 미해결 공지사항 권한 로그
SELECT 
  apl.id,
  apl.announcement_id,
  a.title as announcement_title,
  apl.invalid_departments,
  apl.action,
  apl.detected_at,
  apl.resolved_at
FROM announcement_permission_logs apl
LEFT JOIN announcement a ON apl.announcement_id = a.id
WHERE apl.resolved_at IS NULL 
ORDER BY apl.detected_at DESC;

-- 통계: 미해결 건수
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
2. SSO API에서 404 응답이 오는지 확인 (404는 로그에 기록하지 않음)
3. 스케줄러 로그 확인

## 관련 파일

### 스케줄러
- `src/context/wiki-context/wiki-permission.scheduler.ts`
- `src/context/announcement-context/announcement-permission.scheduler.ts`

### 엔티티
- `src/domain/sub/wiki-file-system/wiki-permission-log.entity.ts`
- `src/domain/sub/wiki-file-system/wiki-permission-action.types.ts`
- `src/domain/core/announcement/announcement-permission-log.entity.ts`
- `src/domain/core/announcement/announcement-permission-action.types.ts`

### 서비스
- `src/domain/common/sso/sso.service.ts`
- `src/domain/common/sso/sso.module.ts`
