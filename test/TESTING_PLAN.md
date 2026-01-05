# 테스트 작성 계획

## 현재 상태 (2026년 1월 5일)

### ✅ 완료된 작업

#### 1. 테스트 인프라 구축
- [x] Testcontainers (PostgreSQL) 설정
- [x] E2E 테스트 헬퍼 (`TestSuiteHelper`, `TestDataBuilder`)
- [x] Fixture 시스템 (`EmployeeFixture`, `AnnouncementPopupFixture`)
- [x] Jest 설정 (단위 테스트, E2E 테스트)

#### 2. AnnouncementPopup 도메인 테스트 완료
- [x] Domain Layer: `announcement-popup.entity.spec.ts` (9개 테스트)
- [x] Business Layer: `announcement-popup.service.spec.ts` (27개 테스트)
- [x] Context Layer: Handler 테스트 (9개 테스트)
- [x] Integration Layer: `announcement-popup.integration.spec.ts` (4개 테스트)
- [x] E2E Tests: 5개 파일, 65개 테스트 (39개 통과, 26개 수정 필요)

#### 3. 테스트 파일 재구조화
- [x] `src/` → `test/` 폴더로 이동
- [x] 계층별 디렉토리 구조 생성
  - `test/domain/`
  - `test/business/`
  - `test/context/`
  - `test/integration/`
  - `test/e2e/`

### 📊 테스트 통계

| 레이어 | 파일 수 | 테스트 수 | 상태 |
|--------|---------|-----------|------|
| Domain | 1 | 9 | ✅ 100% |
| Business | 1 | 27 | ✅ 100% |
| Context | 3 | 9 | ✅ 100% |
| Integration | 1 | 4 | ✅ 100% |
| E2E | 5 | 65 | ⚠️ 60% (39/65) |
| **합계** | **11** | **114** | **✅ 84%** |

---

## 다음 단계: 11개 도메인 테스트 작성

### 우선순위 1: Core Domain (핵심 비즈니스)

#### 1. ShareholdersMeeting (주주총회)
**예상 작업량**: 중간 (특수 필드: `resultOfVote`)

**테스트 파일 구조**:
```
test/
├── domain/core/shareholders-meeting/
│   └── shareholders-meeting.entity.spec.ts
├── business/shareholders-meeting/
│   └── shareholders-meeting.service.spec.ts
├── context/shareholders-meeting/handlers/commands/
│   ├── create-shareholders-meeting.handler.spec.ts
│   ├── update-shareholders-meeting.handler.spec.ts
│   └── delete-shareholders-meeting.handler.spec.ts
├── integration/shareholders-meeting/
│   └── shareholders-meeting.integration.spec.ts
└── e2e/shareholders-meeting/
    ├── get-shareholders-meetings.e2e-spec.ts
    ├── get-shareholders-meeting-by-id.e2e-spec.ts
    ├── post-shareholders-meeting.e2e-spec.ts
    ├── patch-shareholders-meeting.e2e-spec.ts
    └── delete-shareholders-meeting.e2e-spec.ts
```

**특수 테스트 케이스**:
- `ResultOfVote` 객체 검증
- 의결 결과 계산 로직
- 승인율 계산

#### 2. ElectronicDisclosure (전자공시)
**예상 작업량**: 낮음 (표준 CRUD)

**테스트 파일 구조**: AnnouncementPopup과 동일

#### 3. IR (투자자 관계)
**예상 작업량**: 낮음 (표준 CRUD)

**테스트 파일 구조**: AnnouncementPopup과 동일

#### 4. Brochure (브로슈어)
**예상 작업량**: 낮음 (표준 CRUD)

**테스트 파일 구조**: AnnouncementPopup과 동일

#### 5. News (뉴스)
**예상 작업량**: 낮음 (표준 CRUD)

**테스트 파일 구조**: AnnouncementPopup과 동일

#### 6. Announcement (공지사항)
**예상 작업량**: 중간 (특수 필드: `AnnouncementEmployee`)

**테스트 파일 구조**: AnnouncementPopup과 동일

**특수 테스트 케이스**:
- `AnnouncementEmployee` 배열 검증
- 읽음/제출 상태 관리
- 필독 여부 검증
- 조회수 증가 로직

---

### 우선순위 2: Sub Domain (부가 기능)

#### 7. LumirStory (루미르 스토리)
**예상 작업량**: 낮음 (표준 CRUD)

**테스트 파일 구조**: AnnouncementPopup과 동일

#### 8. VideoGallery (비디오 갤러리)
**예상 작업량**: 낮음 (표준 CRUD)

**테스트 파일 구조**: AnnouncementPopup과 동일

#### 9. Survey (설문조사)
**예상 작업량**: 높음 (복잡한 구조)

**테스트 파일 구조**: AnnouncementPopup과 동일

**특수 테스트 케이스**:
- `Inquery` 배열 검증
- 다양한 `InqueryType` 처리
- `InqueryResponse` 데이터 검증
- `InqueryFormData` Map 구조 검증

#### 10. EducationManagement (교육 관리)
**예상 작업량**: 중간 (특수 필드: `Attendee`)

**테스트 파일 구조**: AnnouncementPopup과 동일

**특수 테스트 케이스**:
- `Attendee` 배열 검증
- 수강 상태 관리
- 기한 초과 처리

#### 11. Wiki (위키)
**예상 작업량**: 높음 (파일 시스템 구조)

**테스트 파일 구조**: AnnouncementPopup과 동일

**특수 테스트 케이스**:
- `WikiFileSystem` 트리 구조 검증
- 폴더/파일 계층 관리
- 부모-자식 관계 검증

---

## 테스트 작성 순서

### Phase 1: 표준 CRUD 도메인 (1-2주)
1. ElectronicDisclosure
2. IR
3. Brochure
4. News
5. LumirStory
6. VideoGallery

**목표**: 6개 도메인 × 11개 테스트 파일 = 66개 파일

### Phase 2: 중간 복잡도 도메인 (1주)
7. ShareholdersMeeting
8. Announcement
9. EducationManagement

**목표**: 3개 도메인 × 11개 테스트 파일 = 33개 파일

### Phase 3: 고복잡도 도메인 (1-2주)
10. Survey
11. Wiki

**목표**: 2개 도메인 × 11개 테스트 파일 = 22개 파일

---

## 테스트 템플릿

### 1. Domain Layer 테스트 템플릿

```typescript
import { EntityName } from '@domain/core/entity-name/entity-name.entity';
import { EntityNameFixture } from '../../../fixtures';
import { ContentStatus } from '@domain/core/common/types/status.types';

describe('EntityName Entity', () => {
  describe('생성자', () => {
    it('모든 필드가 제공되면 정상적으로 생성되어야 한다', () => {
      // Given & When & Then
    });
  });

  describe('상태 변경', () => {
    it('상태를 변경할 수 있어야 한다', () => {
      // Given & When & Then
    });
  });

  describe('DTO 변환', () => {
    it('Entity를 DTO로 변환할 수 있어야 한다', () => {
      // Given & When & Then
    });
  });
});
```

### 2. Business Layer 테스트 템플릿

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityNameService } from '@business/entity-name/entity-name.service';
import { EntityName } from '@domain/core/entity-name/entity-name.entity';
import { EntityNameFixture } from '../../fixtures';

describe('EntityNameService', () => {
  let service: EntityNameService;
  let repository: jest.Mocked<Repository<EntityName>>;

  beforeEach(async () => {
    // Setup
  });

  describe('목록_조회', () => {
    it('모든 항목을 조회해야 한다', async () => {
      // Given & When & Then
    });
  });

  describe('단건_조회', () => {
    it('ID로 항목을 조회해야 한다', async () => {
      // Given & When & Then
    });
  });

  describe('생성', () => {
    it('새 항목을 생성해야 한다', async () => {
      // Given & When & Then
    });
  });

  describe('수정', () => {
    it('기존 항목을 수정해야 한다', async () => {
      // Given & When & Then
    });
  });

  describe('삭제', () => {
    it('항목을 소프트 삭제해야 한다', async () => {
      // Given & When & Then
    });
  });
});
```

### 3. E2E 테스트 템플릿

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSuiteHelper, TestDataBuilder } from '../../helpers';

describe('GET /entity-names (E2E)', () => {
  let app: INestApplication;
  let testSuite: TestSuiteHelper;
  let testDataBuilder: TestDataBuilder;

  beforeAll(async () => {
    testSuite = new TestSuiteHelper();
    app = await testSuite.initializeApp();
    testDataBuilder = new TestDataBuilder(testSuite.getDataSource());
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  describe('성공 케이스', () => {
    it('모든 항목을 조회해야 한다', async () => {
      // Given & When & Then
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 요청 시 에러를 반환해야 한다', async () => {
      // Given & When & Then
    });
  });
});
```

---

## 자동화 스크립트

### 테스트 파일 생성 스크립트

```bash
# 새 도메인 테스트 파일 생성
npm run test:scaffold -- --domain=shareholders-meeting --type=core
```

### 전체 테스트 실행

```bash
# 모든 단위 테스트
npm run test:unit

# 모든 E2E 테스트
npm run test:e2e

# 특정 도메인 테스트
npm run test:unit -- shareholders-meeting
npm run test:e2e -- shareholders-meeting

# 커버리지 포함
npm run test:cov
```

---

## 예상 일정

| Phase | 기간 | 도메인 수 | 테스트 파일 수 | 누적 테스트 수 |
|-------|------|-----------|----------------|----------------|
| Phase 0 (완료) | - | 1 | 11 | 114 |
| Phase 1 | 1-2주 | 6 | 66 | ~800 |
| Phase 2 | 1주 | 3 | 33 | ~1,200 |
| Phase 3 | 1-2주 | 2 | 22 | ~1,500 |
| **합계** | **3-5주** | **12** | **132** | **~1,500** |

---

## 체크리스트

### 각 도메인 완료 기준

- [ ] Domain Layer 테스트 (9+ 테스트)
- [ ] Business Layer 테스트 (27+ 테스트)
- [ ] Context Layer 테스트 (9+ 테스트)
- [ ] Integration 테스트 (4+ 테스트)
- [ ] E2E 테스트 (65+ 테스트)
- [ ] 모든 테스트 통과
- [ ] 코드 커버리지 80% 이상

---

**작성일**: 2026년 1월 5일  
**작성자**: AI Assistant  
**버전**: v1.0
