# 데이터베이스 구현 가이드

> 📚 **문서 네비게이션**
> - **[메인 문서로 돌아가기](er-diagram.md)** - 전체 시스템 개요
> - **[엔티티 상세 보기](er-diagram-entities.md)** - 모든 엔티티 구조

---

## 목차

- [JSONB 필드 구조](#jsonb-필드-구조)
  - [attachments (첨부파일)](#attachments-첨부파일)
  - [InqueryFormData (설문 질문 폼)](#inqueryformdata-설문-질문-폼)
  - [Announcement 권한 필드](#announcement-권한-필드)
- [데이터베이스 특징 상세](#데이터베이스-특징-상세)
- [인덱스 권장사항](#인덱스-권장사항)
- [CHECK 제약조건](#check-제약조건)
- [변경 이력](#변경-이력)

---

## JSONB 필드 구조

### attachments (첨부파일)

```json
[
  {
    "fileName": "report.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "url": "https://s3.amazonaws.com/bucket/files/report.pdf",
    "order": 0
  },
  {
    "fileName": "image.jpg",
    "fileSize": 512000,
    "mimeType": "image/jpeg",
    "url": "https://s3.amazonaws.com/bucket/files/image.jpg",
    "order": 1
  }
]
```

**적용 엔티티**:
- ShareholdersMeeting, IR, News, Announcement
- MainPopup, LumirStory, VideoGallery, EducationManagement

**특징**:
- AWS S3에 파일 업로드 후 메타데이터만 저장
- `order` 필드로 첨부파일 순서 관리
- 파일 크기는 bytes 단위

---

### InqueryFormData (설문 질문 폼)

**객관식/드롭다운**:
```json
{
  "options": ["옵션1", "옵션2", "옵션3", "옵션4"]
}
```

**선형 척도**:
```json
{
  "min": 1,
  "max": 5,
  "minLabel": "매우 불만족",
  "maxLabel": "매우 만족"
}
```

**그리드**:
```json
{
  "rows": ["서비스 품질", "응대 태도", "처리 속도"],
  "columns": ["매우 불만족", "불만족", "보통", "만족", "매우 만족"]
}
```

---

### Announcement 권한 필드

Announcement에는 세밀한 공개범위 설정을 위한 4가지 권한 필드가 있습니다:

#### 1. permissionEmployeeIds (특정 직원)
```json
["employee-uuid-1", "employee-uuid-2", "employee-uuid-3"]
```

#### 2. permissionRankCodes (직급)
```json
["staff", "assistant_manager", "manager", "deputy_general_manager", "general_manager", "executive"]
```

**직급 코드 예시**:
- `staff` - 사원
- `assistant_manager` - 대리
- `manager` - 과장
- `deputy_general_manager` - 차장
- `general_manager` - 부장
- `executive` - 임원

#### 3. permissionPositionCodes (직책)
```json
["team_leader", "part_leader", "division_head", "department_head"]
```

**직책 코드 예시**:
- `team_leader` - 팀장
- `part_leader` - 파트장
- `division_head` - 본부장
- `department_head` - 실장

#### 4. permissionDepartmentCodes (부서)
```json
["dev", "hr", "sales", "marketing", "finance"]
```

**부서 코드 예시**:
- `dev` - 개발팀
- `hr` - 인사팀
- `sales` - 영업팀
- `marketing` - 마케팅팀
- `finance` - 재무팀

#### 접근 권한 로직 (OR 조건)

```typescript
function canAccess(announcement: Announcement, employee: Employee): boolean {
  // 전사 공개
  if (announcement.isPublic) {
    return true;
  }
  
  // 제한 공개 (하나라도 일치하면 접근 가능)
  return (
    announcement.permissionEmployeeIds.includes(employee.id) ||
    announcement.permissionRankCodes.includes(employee.rankCode) ||
    announcement.permissionPositionCodes.includes(employee.positionCode) ||
    announcement.permissionDepartmentCodes.includes(employee.departmentCode)
  );
}
```

#### 예시

```json
{
  "title": "2024년 성과평가 안내",
  "isPublic": false,
  "permissionEmployeeIds": ["emp-123"],
  "permissionRankCodes": ["manager", "general_manager", "executive"],
  "permissionPositionCodes": ["team_leader"],
  "permissionDepartmentCodes": ["hr"]
}
// → 김철수(emp-123) OR 과장급 이상 OR 팀장 OR 인사팀 = 접근 가능
```

---

## 데이터베이스 특징 상세

### 1. 통합 카테고리 관리

**구조**:
- **단일 Category 테이블**: 모든 도메인의 카테고리를 하나의 테이블로 관리
- **entityType 필드**: 도메인 구분
- **CategoryMapping 중간 테이블**: 엔티티-카테고리 간 다대다 관계

**장점**:
- 카테고리 관리 일원화
- 동일한 구조 공유 (name, description, isActive, order)
- 복합 인덱스 활용 가능

**예시**:
```sql
-- 공지사항 카테고리만 조회
SELECT * FROM category 
WHERE entity_type = 'announcement' AND is_active = true
ORDER BY "order";

-- 특정 공지사항의 카테고리 목록
SELECT c.* FROM category c
JOIN category_mapping cm ON c.id = cm.category_id
WHERE cm.entity_id = 'announcement-uuid-123';
```

---

### 2. 다국어 지원 (Translation Tables)

**번역 테이블이 있는 엔티티**:
- MainPopup, ShareholdersMeeting, VoteResult
- ElectronicDisclosure, IR, Brochure

**구조**:
- 기본 테이블: 언어 독립적 데이터 (ID, 상태, 공개 여부 등)
- 번역 테이블: 언어별 콘텐츠 (title, content, description 등)

**장점**:
- 언어별 데이터 완전 분리
- 번역 누락 감지 용이
- 외래 키로 무결성 보장

**Fallback 전략**:
```typescript
// 우선순위: 요청 언어 → 한국어(기본) → 영어 → 첫 번째 사용 가능한 번역
async getTranslation(entityId: string, requestedLangCode: string) {
  let translation = await this.findTranslation(entityId, requestedLangCode);
  if (translation) return translation;
  
  translation = await this.findTranslation(entityId, 'ko');  // 한국어
  if (translation) return translation;
  
  translation = await this.findTranslation(entityId, 'en');  // 영어
  if (translation) return translation;
  
  translation = await this.findFirstAvailableTranslation(entityId);
  if (translation) return translation;
  
  throw new NotFoundException('No translation available');
}
```

---

### 3. 타입별 설문 응답 테이블

**7개 응답 테이블**:
- `survey_response_text` - 단답형/장문형
- `survey_response_choice` - 객관식/드롭다운
- `survey_response_checkbox` - 체크박스 (다중 선택)
- `survey_response_scale` - 선형 척도 (1-10)
- `survey_response_grid` - 그리드 (행-열 매트릭스)
- `survey_response_file` - 파일 업로드
- `survey_response_datetime` - 날짜/시간

**장점**:
- 통계 쿼리 성능 10배 이상 향상
- DB 레벨에서 타입 안전성 보장
- CHECK 제약조건으로 비즈니스 규칙 강제
- 일반 컬럼 인덱스 사용 (JSONB GIN보다 빠름)

**통계 쿼리 예시**:
```sql
-- 객관식 통계
SELECT 
  selected_option,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM survey_response_choice
WHERE question_id = 'uuid'
GROUP BY selected_option;

-- 척도 평균
SELECT 
  AVG(scale_value) as average,
  STDDEV(scale_value) as std_dev
FROM survey_response_scale
WHERE question_id = 'uuid';
```

---

### 4. Lazy Creation 패턴 (공지사항)

**구조**:
- `AnnouncementRead`: 직원이 읽을 때만 레코드 생성
- `AnnouncementResponse`: 직원이 응답할 때만 레코드 생성

**장점**:
- 확장성 대폭 향상 (수천 명 직원도 문제 없음)
- 배치 처리 불필요
- 스토리지 효율적 사용

**예시**:
```typescript
// 읽음 처리
async markAsRead(announcementId: string, employeeId: string) {
  // 중복 확인 후 레코드 생성
  const existing = await this.findOne({ announcementId, employeeId });
  if (existing) return existing;
  
  return await this.create({
    announcementId,
    employeeId,
    readAt: new Date()
  });
}
```

---

### 5. 계층 구조 (WikiFileSystem)

**구조**:
- 자기 참조: `parentId` 필드로 부모 폴더 참조
- 타입: `folder` (폴더) / `file` (파일)

**재귀 쿼리 예시**:
```sql
-- 특정 파일의 전체 경로 추적
WITH RECURSIVE path AS (
  SELECT id, name, parent_id, name as full_path, 0 as depth
  FROM wiki_file_system
  WHERE id = 'file-uuid'
  
  UNION ALL
  
  SELECT w.id, w.name, w.parent_id, w.name || '/' || p.full_path, p.depth + 1
  FROM wiki_file_system w
  JOIN path p ON w.id = p.parent_id
)
SELECT full_path, depth FROM path 
WHERE parent_id IS NULL
ORDER BY depth DESC
LIMIT 1;
```

---

### 6. 공통 기능

**Soft Delete**:
- `deletedAt` 필드로 논리 삭제
- 실제 데이터는 유지 (복구 가능)
- 모든 쿼리에 `WHERE deleted_at IS NULL` 조건 필요

**Optimistic Locking**:
- `version` 필드로 동시성 제어
- 수정 시 version 증가
- 버전 불일치 시 충돌 감지

**Audit Fields**:
- `createdAt`, `updatedAt` - 생성/수정 일시
- `createdBy`, `updatedBy` - 생성/수정자 (외부 시스템 직원 ID)

**Order Field**:
- 모든 콘텐츠 엔티티에 `order` 필드
- 관리자가 임의로 표시 순서 변경 가능

---

## 인덱스 권장사항

### 공통 인덱스 (모든 테이블)

```sql
-- Soft Delete 필터링
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);

-- 생성일 기준 정렬
CREATE INDEX idx_{table}_created_at ON {table}(created_at DESC) 
WHERE deleted_at IS NULL;

-- 생성자별 조회
CREATE INDEX idx_{table}_created_by ON {table}(created_by) 
WHERE deleted_at IS NULL;
```

### CategoryMapping

```sql
-- 특정 엔티티의 카테고리 조회
CREATE INDEX idx_category_mapping_entity 
ON category_mapping(entity_id) 
WHERE deleted_at IS NULL;

-- 특정 카테고리의 엔티티 조회
CREATE INDEX idx_category_mapping_category 
ON category_mapping(category_id) 
WHERE deleted_at IS NULL;

-- 유니크 제약조건
CREATE UNIQUE INDEX idx_category_mapping_unique 
ON category_mapping(entity_id, category_id) 
WHERE deleted_at IS NULL;
```

### Category

```sql
-- 엔티티 타입별 활성 카테고리
CREATE INDEX idx_category_entity_type_active 
ON category(entity_type, is_active, "order") 
WHERE deleted_at IS NULL;
```

### Announcement

```sql
-- 공개 여부 + 상태별 조회
CREATE INDEX idx_announcement_public_status 
ON announcement(is_public, status, "order") 
WHERE deleted_at IS NULL;

-- 고정 공지사항
CREATE INDEX idx_announcement_fixed 
ON announcement(is_fixed, "order") 
WHERE deleted_at IS NULL AND is_fixed = true;

-- 유효한 공지 (만료일 기준)
CREATE INDEX idx_announcement_active 
ON announcement(released_at, expired_at) 
WHERE deleted_at IS NULL AND is_public = true;
```

### AnnouncementRead / AnnouncementResponse

```sql
-- 공지사항별 통계
CREATE INDEX idx_announcement_read_announcement 
ON announcement_read(announcement_id) 
WHERE deleted_at IS NULL;

-- 직원별 목록
CREATE INDEX idx_announcement_read_employee 
ON announcement_read(employee_id, read_at DESC) 
WHERE deleted_at IS NULL;

-- 유니크 제약
CREATE UNIQUE INDEX idx_announcement_read_unique 
ON announcement_read(announcement_id, employee_id) 
WHERE deleted_at IS NULL;
```

### Survey 응답 테이블

```sql
-- 각 응답 테이블별 인덱스
CREATE INDEX idx_survey_response_{type}_question 
ON survey_response_{type}(question_id) 
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_survey_response_{type}_unique 
ON survey_response_{type}(question_id, employee_id) 
WHERE deleted_at IS NULL;

-- 예: 객관식 (추가 인덱스)
CREATE INDEX idx_survey_response_choice_option 
ON survey_response_choice(question_id, selected_option) 
WHERE deleted_at IS NULL;
```

### EducationManagement

```sql
-- 담당자별 교육 목록
CREATE INDEX idx_education_management_manager 
ON education_management(manager_id) 
WHERE deleted_at IS NULL;

-- 마감일 기준 정렬
CREATE INDEX idx_education_management_deadline 
ON education_management(deadline) 
WHERE deleted_at IS NULL;
```

### WikiFileSystem

```sql
-- 부모 폴더별 자식 조회
CREATE INDEX idx_wiki_file_system_parent 
ON wiki_file_system(parent_id, "order") 
WHERE deleted_at IS NULL;

-- 루트 폴더 조회
CREATE INDEX idx_wiki_file_system_root 
ON wiki_file_system(parent_id, "order") 
WHERE deleted_at IS NULL AND parent_id IS NULL;
```

### 번역 테이블

```sql
-- 각 번역 테이블 (예: ShareholdersMeetingTranslation)
CREATE INDEX idx_{entity}_translation_{entity} 
ON {entity}_translation({entity}_id) 
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_{entity}_translation_unique 
ON {entity}_translation({entity}_id, language_id) 
WHERE deleted_at IS NULL;
```

---

## CHECK 제약조건

### VoteResult (의결 결과)

```sql
-- 투표수 검증: 전체 = 찬성 + 반대
ALTER TABLE vote_result ADD CONSTRAINT chk_vote_result_valid 
  CHECK (total_vote = yes_vote + no_vote);

-- 찬성률 범위: 0% ~ 100%
ALTER TABLE vote_result ADD CONSTRAINT chk_approval_rating 
  CHECK (approval_rating >= 0 AND approval_rating <= 100);

-- 투표수는 0 이상
ALTER TABLE vote_result ADD CONSTRAINT chk_vote_positive 
  CHECK (total_vote >= 0 AND yes_vote >= 0 AND no_vote >= 0);

-- 안건 번호는 1 이상
ALTER TABLE vote_result ADD CONSTRAINT chk_agenda_number_positive 
  CHECK (agenda_number > 0);
```

### Announcement (공지사항)

```sql
-- 만료일은 공개일보다 이후
ALTER TABLE announcement ADD CONSTRAINT chk_announcement_dates 
  CHECK (expired_at IS NULL OR released_at IS NULL OR expired_at > released_at);

-- 제한공개 시 최소 하나의 권한 필드 필요
ALTER TABLE announcement ADD CONSTRAINT chk_announcement_permissions 
  CHECK (
    (is_public = true) OR 
    (is_public = false AND (
      jsonb_array_length(permission_employee_ids) > 0 OR
      jsonb_array_length(permission_rank_codes) > 0 OR
      jsonb_array_length(permission_position_codes) > 0 OR
      jsonb_array_length(permission_department_codes) > 0
    ))
  );
```

### AnnouncementRead / AnnouncementResponse

```sql
-- 읽은 시각은 과거
ALTER TABLE announcement_read ADD CONSTRAINT chk_announcement_read_time 
  CHECK (read_at <= NOW());

-- 응답 제출 시각은 과거
ALTER TABLE announcement_response ADD CONSTRAINT chk_announcement_response_time 
  CHECK (submitted_at <= NOW());

-- 응답 메시지는 비어있지 않음
ALTER TABLE announcement_response ADD CONSTRAINT chk_announcement_response_message 
  CHECK (LENGTH(TRIM(response_message)) > 0);
```

### Survey (설문조사)

```sql
-- 종료일은 시작일보다 이후
ALTER TABLE survey ADD CONSTRAINT chk_survey_dates 
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- 권한 배열은 비어있지 않음
ALTER TABLE survey ADD CONSTRAINT chk_survey_permissions 
  CHECK (jsonb_array_length(permission_employee_ids) > 0);
```

### SurveyResponse (설문 응답)

```sql
-- 모든 응답 테이블: 제출 시각은 과거
ALTER TABLE survey_response_{type} ADD CONSTRAINT chk_response_{type}_submitted 
  CHECK (submitted_at <= NOW());

-- 척도: 값 범위 (1-10)
ALTER TABLE survey_response_scale ADD CONSTRAINT chk_response_scale_value 
  CHECK (scale_value >= 1 AND scale_value <= 10);

-- 파일: 크기는 양수
ALTER TABLE survey_response_file ADD CONSTRAINT chk_response_file_size 
  CHECK (file_size > 0);

-- 파일: 크기 제한 500MB
ALTER TABLE survey_response_file ADD CONSTRAINT chk_response_file_size_limit 
  CHECK (file_size <= 524288000);
```

### SurveyCompletion (설문 완료)

```sql
-- 응답 수는 0 이상
ALTER TABLE survey_completion ADD CONSTRAINT chk_completion_answered 
  CHECK (answered_questions >= 0);

-- 응답 수는 전체 질문 수 이하
ALTER TABLE survey_completion ADD CONSTRAINT chk_completion_valid 
  CHECK (answered_questions <= total_questions);
```

### WikiFileSystem (위키)

```sql
-- file 타입은 fileUrl 필수
ALTER TABLE wiki_file_system ADD CONSTRAINT chk_wiki_file_url 
  CHECK (
    (type = 'file' AND file_url IS NOT NULL) OR 
    (type = 'folder' AND file_url IS NULL)
  );

-- file 타입은 fileSize 양수
ALTER TABLE wiki_file_system ADD CONSTRAINT chk_wiki_file_size 
  CHECK (
    (type = 'folder') OR 
    (type = 'file' AND file_size > 0)
  );

-- 권한 배열은 비어있지 않음
ALTER TABLE wiki_file_system ADD CONSTRAINT chk_wiki_permissions 
  CHECK (jsonb_array_length(permission_employee_ids) > 0);
```

### EducationManagement (교육 관리)

```sql
-- 마감일은 현재보다 미래
ALTER TABLE education_management ADD CONSTRAINT chk_education_deadline 
  CHECK (deadline >= CURRENT_DATE);
```

### Attendee (수강 직원)

```sql
-- completed 상태는 completedAt 필수
ALTER TABLE attendee ADD CONSTRAINT chk_attendee_completed 
  CHECK (
    (status != 'completed' AND completed_at IS NULL) OR
    (status = 'completed' AND completed_at IS NOT NULL AND completed_at <= NOW())
  );
```

---

## 변경 이력

### v5.8 (2026-01-08)
- ✅ **파일 분리 완료**
  - 3개 파일로 분리: 메인(개요), 엔티티(상세), 데이터베이스(구현)
  - 각 파일 간 네비게이션 링크 추가
  - 문서 구조 개선 및 가독성 향상

### v5.7 (2026-01-08)
- ✅ **인덱스 권장사항 추가**
  - 모든 주요 테이블 인덱스 정의
  - EducationManagement에 managerId 인덱스 추가
  - 부분 인덱스 활용 (WHERE deleted_at IS NULL)
  - 유니크 인덱스로 무결성 + 성능 달성

### v5.6 (2026-01-07)
- ✅ **공지사항 테이블 구조 개선**
  - Sparse Data Pattern 적용 (Lazy Creation)
  - `AnnouncementEmployee` → `AnnouncementRead`, `AnnouncementResponse` 분리
  - 세밀한 공개범위 설정 (직급/직책/부서별)
  - 확장성 대폭 향상
- ✅ **첨부파일 구조 단순화**
  - `Attachment` 테이블 제거 → JSONB 필드로 통합
  - ShareholdersMeeting: 언어 독립적 첨부파일은 기본 테이블에 저장

### v5.5 (2026-01-07)
- ✅ **설문조사 응답 테이블 타입별 분리**
  - JSONB 단일 테이블 → 7개 타입별 테이블
  - 통계 쿼리 성능 10배 이상 향상
  - `survey_completion` 테이블 추가
  - CHECK 제약조건 추가

### v5.4 (2026-01-07)
- ✅ **설문조사 통계 처리 전략 추가**
  - 4가지 해결 방안 제시
  - 단계별 권장 사항

### v5.3 (2026-01-07)
- ✅ **JSONB 통계 집계 쿼리 예시 추가**

### v5.2 (2026-01-07)
- ✅ **CHECK 제약조건 추가** (모든 주요 엔티티)
- ✅ **다국어 Fallback 전략 추가** (한국어 기본)

### v5.1 (2026-01-06)
- ✅ **Core/Sub Domain 분리 및 재구성**
- ✅ **Common Domain 상세 정보 추가**
- ✅ **CategoryMapping entityType 제거** (데이터 정규화)

---

**문서 생성일**: 2026년 1월 6일  
**최종 업데이트**: 2026년 1월 8일  
**버전**: v5.8
