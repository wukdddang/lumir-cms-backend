# 권한 검증 배치 작업 - 수동 실행 가이드

## 개요

권한 검증 배치 작업은 매일 자동으로 실행되지만, 필요시 관리자가 즉시 실행할 수 있는 API를 제공합니다.

## API 엔드포인트

### 1. 위키 권한 검증 즉시 실행

```http
POST /admin/permission-validation/wiki
Authorization: Bearer {admin-token}
```

**응답**:
```json
{
  "success": true,
  "message": "위키 권한 검증이 완료되었습니다.",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### 2. 공지사항 권한 검증 즉시 실행

```http
POST /admin/permission-validation/announcement
Authorization: Bearer {admin-token}
```

**응답**:
```json
{
  "success": true,
  "message": "공지사항 권한 검증이 완료되었습니다.",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### 3. 모든 권한 검증 즉시 실행 (병렬)

```http
POST /admin/permission-validation/all
Authorization: Bearer {admin-token}
```

**응답**:
```json
{
  "success": true,
  "message": "모든 권한 검증이 완료되었습니다.",
  "results": {
    "wiki": "완료",
    "announcement": "완료"
  },
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

## 사용 시나리오

### 시나리오 1: SSO에서 부서 삭제 후 즉시 확인

1. SSO 관리자가 "구 마케팅팀" 부서를 삭제
2. CMS 관리자가 즉시 배치 작업 실행:
   ```bash
   curl -X POST http://localhost:3000/admin/permission-validation/all \
     -H "Authorization: Bearer {admin-token}"
   ```
3. 로그 확인:
   - `DETECTED`: 무효한 부서 발견
   - `REMOVED`: 자동 제거
   - `NOTIFIED`: 관리자에게 알림

### 시나리오 2: 대규모 조직 개편 후 검증

1. 여러 부서가 통폐합됨
2. 관리자가 모든 권한 검증 실행
3. 로그를 확인하여 영향받은 위키/공지사항 파악
4. 필요한 경우 수동으로 권한 재설정

### 시나리오 3: 정기 점검

1. 월말에 수동으로 권한 검증 실행
2. 무효한 권한이 있는지 확인
3. 해결 여부 체크 (`RESOLVED` 상태)

## cURL 예시

### 위키 권한 검증

```bash
curl -X POST http://localhost:3000/admin/permission-validation/wiki \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### 공지사항 권한 검증

```bash
curl -X POST http://localhost:3000/admin/permission-validation/announcement \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### 모든 권한 검증 (병렬)

```bash
curl -X POST http://localhost:3000/admin/permission-validation/all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

## Swagger UI에서 테스트

1. Swagger UI 접속: `http://localhost:3000/api-docs`
2. "Admin - 권한 검증" 섹션으로 이동
3. "Authorize" 버튼 클릭하여 관리자 토큰 입력
4. 원하는 엔드포인트의 "Try it out" 버튼 클릭
5. "Execute" 버튼으로 즉시 실행

## 자동 스케줄 vs 수동 실행

### 자동 스케줄 (Cron)

- **위키**: 매일 새벽 2시 (`0 2 * * *`)
- **공지사항**: 매일 새벽 3시 (`0 3 * * *`)
- **장점**: 자동화, 정기적인 검증
- **단점**: 즉시성 없음

### 수동 실행 (API)

- **실행 시점**: 관리자가 원하는 때
- **장점**: 즉시성, 유연성, 테스트 용이
- **단점**: 수동 작업 필요

### 권장 사용법

1. **평시**: 자동 스케줄에 맡김 (매일 새벽 실행)
2. **긴급 상황**: 수동 실행 API 사용
   - SSO 대규모 변경 후
   - 문제 발생 시 즉시 확인 필요
   - 시스템 점검 중
3. **개발/테스트**: 수동 실행 API로 동작 확인

## 주의사항

### 1. 중복 로그 방지

- 이미 미해결(`DETECTED`) 로그가 있으면 새 로그를 생성하지 않음
- 여러 번 실행해도 안전

### 2. 처리 시간

- 대량의 데이터가 있을 경우 시간이 소요될 수 있음
- 비동기 처리되므로 API 응답은 즉시 반환

### 3. 권한

- 관리자 권한(`AdminGuard`)이 필요
- 일반 사용자는 실행 불가

### 4. 로깅

- 모든 실행 내역은 서버 로그에 기록됨
- 로그 레벨: `INFO`, `WARN`, `ERROR`

## 로그 확인

### 권한 로그 테이블 조회

```sql
-- 위키 권한 로그
SELECT * FROM wiki_permission_logs 
WHERE resolved_at IS NULL 
ORDER BY detected_at DESC;

-- 공지사항 권한 로그
SELECT * FROM announcement_permission_logs 
WHERE resolved_at IS NULL 
ORDER BY detected_at DESC;
```

### 서버 로그 확인

```bash
# 위키 권한 검증 로그
grep "위키 권한 검증" /var/log/cms-backend.log

# 공지사항 권한 검증 로그
grep "공지사항 권한 검증" /var/log/cms-backend.log
```

## 문제 해결

### API 호출 실패

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**해결**: 관리자 토큰을 확인하세요.

### 배치 작업 중 오류

```json
{
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

**확인사항**:
1. SSO 서버 연결 상태
2. 데이터베이스 연결 상태
3. 서버 로그에서 상세 오류 확인

## 모듈 등록

메인 애플리케이션 모듈에 `PermissionValidationModule`을 등록해야 합니다:

```typescript
// app.module.ts 또는 admin.module.ts
import { PermissionValidationModule } from '@api/admin/permission-validation';

@Module({
  imports: [
    // ... other modules
    PermissionValidationModule,
  ],
})
export class AppModule {}
```

## 참고 문서

- [권한 검증 스케줄러 가이드](./permission-scheduler-guide.md)
- [공지사항 권한 로그 가이드](./announcement-permission-log-guide.md)
- [ERD 문서](./erd/er-diagram.md)
