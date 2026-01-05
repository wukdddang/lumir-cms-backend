# 루미르 CMS 백엔드 - 구현 현황

## ✅ 완료된 도메인 (13개)

### 공통 모듈 (1개)
1. **CmsCommon** - 직원, 부서, 직책, 직급, 조직 하이라키, 알림
   - 경로: `src/interface/common/`
   - 엔드포인트: 11개
   - 상태: ✅ 완료 (Interface Layer)

### Core Domain (7개)
2. **AnnouncementPopup** - 공지사항 팝업
   - 경로: `src/interface/announcement-popup/`
   - 엔드포인트: 5개 (CRUD + 목록)
   - 상태: ✅ 완료 (Interface Layer)

3. **Announcement** - 공지사항
   - 경로: `src/interface/announcement/`
   - 엔드포인트: 12개 (CRUD + 카테고리 + 첨부파일 + 대상자 + 응답)
   - 상태: ✅ 완료 (Interface Layer)

4. **News** - 뉴스
   - 경로: `src/interface/news/`
   - 엔드포인트: 15개 (CRUD + 카테고리 + 언어 + 번역 + URL)
   - 상태: ✅ 완료 (Interface Layer)

5. **Brochure** - 브로슈어
   - 경로: `src/interface/brochure/`
   - 엔드포인트: 13개 (CRUD + 카테고리 + 언어 + 번역)
   - 상태: ✅ 완료 (Interface Layer)

6. **IR** - 투자자 관계
   - 경로: `src/interface/ir/`
   - 엔드포인트: 13개 (CRUD + 카테고리 + 언어 + 번역)
   - 상태: ✅ 완료 (Interface Layer)

7. **ShareholdersMeeting** - 주주총회
   - 경로: `src/interface/shareholders-meeting/`
   - 엔드포인트: 20개 (CRUD + 카테고리 + 번역 + 첨부파일 + 상세정보 + 안건)
   - 상태: ✅ 완료 (Interface Layer)

8. **ElectronicNotice** - 전자공시
   - 경로: `src/interface/electronic-notice/`
   - 엔드포인트: 13개 (CRUD + 카테고리 + 번역 + 첨부파일)
   - 상태: ✅ 완료 (Interface Layer)

### Sub Domain (5개)
9. **Survey** - 설문조사
   - 경로: `src/interface/survey/`
   - 엔드포인트: 9개 (CRUD + 카테고리 + 응답 제출 + 결과)
   - 상태: ✅ 완료 (Interface Layer)

10. **Popup** - 팝업
    - 경로: `src/interface/popup/`
    - 엔드포인트: 13개 (CRUD + 카테고리 + 번역 + 첨부파일)
    - 상태: ✅ 완료 (Interface Layer)

11. **LumirStory** - 루미르 스토리
    - 경로: `src/interface/lumir-story/`
    - 엔드포인트: 13개 (CRUD + 카테고리 + 번역 + 첨부파일)
    - 상태: ✅ 완료 (Interface Layer)

12. **VideoGallery** - 비디오 갤러리
    - 경로: `src/interface/video-gallery/`
    - 엔드포인트: 13개 (CRUD + 카테고리 + 번역 + 첨부파일)
    - 상태: ✅ 완료 (Interface Layer)

13. **EducationManagement** - 교육 관리
    - 경로: `src/interface/education-management/`
    - 엔드포인트: 10개 (CRUD + 수강자 관리 + 첨부파일)
    - 상태: ✅ 완료 (Interface Layer)

14. **Wiki** - 위키
    - 경로: `src/interface/wiki/`
    - 엔드포인트: 10개 (CRUD + 파일시스템 + 검색)
    - 상태: ✅ 완료 (Interface Layer)

---

## 📊 구현 통계

### 전체 현황
- **완료된 도메인**: 14개 / 14개 (100%)
- **완료된 엔드포인트**: 약 159개
- **평균 엔드포인트/도메인**: 11.4개

### 레이어별 구현 현황
- ✅ **Domain Layer**: 100% (모든 Entity, Types 완료)
- ✅ **Interface Layer**: 100% (모든 DTO, Controllers 완료)
- ✅ **Business Layer**: 100% (18/18 완료)
  - ✅ 공통 모듈 (6/6 완료)
  - ✅ 간단한 Core Domain (4/4 완료)
  - ✅ 복잡한 Core Domain (3/3 완료)
  - ✅ Sub Domain (5/5 완료)
- ✅ **Context Layer**: 100% (18/18 완료)
  - ✅ 공통 모듈 (6/6 완료)
  - ✅ 간단한 Core Domain (4/4 완료)
  - ✅ 복잡한 Core Domain (3/3 완료)
  - ✅ Sub Domain (5/5 완료)

---

## 📁 프로젝트 구조

```
src/
├── interface/                    # ✅ 완료된 Interface Layer
│   ├── common/                  # ✅ 공통 모듈 (직원, 부서, 알림)
│   │   ├── dto/
│   │   ├── decorators/
│   │   ├── common.controller.ts
│   │   ├── common.module.ts
│   │   └── index.ts
│   ├── announcement-popup/      # ✅ 공지사항 팝업
│   ├── announcement/            # ✅ 공지사항
│   ├── news/                    # ✅ 뉴스
│   ├── brochure/                # ✅ 브로슈어
│   ├── ir/                      # ✅ IR
│   ├── survey/                  # ✅ 설문조사
│   ├── decorators/              # 공용 데코레이터
│   └── AGENTS.md               # Interface Layer 코딩 규칙
├── domain/                      # ✅ 완료된 Domain Layer
│   ├── common/                  # 공통 도메인 (Employee, Department 등)
│   ├── core/                    # Core Domain Entities
│   │   ├── common/types/        # 공통 타입
│   │   ├── announcement-popup/
│   │   ├── announcement/
│   │   ├── news/
│   │   ├── brochure/
│   │   ├── ir/
│   │   ├── shareholders-meeting/
│   │   └── electronic-disclosure/
│   └── sub/                     # Sub Domain Entities
│       ├── survey/
│       ├── education-management/
│       ├── wiki/
│       ├── lumir-story/
│       └── video-gallery/
├── business/                    # ⏳ 미구현 Business Layer
├── context/                     # ⏳ 미구현 Context Layer
└── libs/                        # 공통 라이브러리
    └── database/base/           # BaseEntity, BaseDTO
```

---

## 🚀 다음 단계: Business & Context Layer

### Phase 1: Business Layer

#### ✅ 완료: 공통 모듈 (6개 서비스)
- ✅ EmployeeService - 직원 CRUD 및 필터링
- ✅ DepartmentService - 부서 조회 및 계층 구조
- ✅ PositionService - 직급 조회 (외부 시스템 연동 대기)
- ✅ RankService - 직책 조회 (외부 시스템 연동 대기)
- ✅ NotificationService - 알림 전송
- ✅ OrganizationService - 조직 하이라키 트리 생성

**구현 위치:** `src/business/common/`
**상태:** ✅ 완료 (2026-01-05)

---

#### ✅ 완료: Core Domain - 간단한 구조 (4개)
- ✅ NewsService - 뉴스 CRUD 및 공개/비공개
- ✅ BrochureService - 브로슈어 CRUD 및 공개/비공개
- ✅ IRService - IR CRUD 및 공개/비공개
- ✅ ElectronicNoticeService - 전자공시 CRUD 및 공개/비공개

**구현 위치:** `src/business/{news,brochure,ir,electronic-notice}/`
**상태:** ✅ 완료 (2026-01-05)

---

#### ✅ 완료: Core Domain - 복잡한 구조 (3개)
- ✅ AnnouncementService - 공지사항 CRUD, 직원 응답 관리
- ✅ ShareholdersMeetingService - 주주총회 CRUD, 의결 결과
- ✅ AnnouncementPopupService - 팝업 CRUD

**구현 위치:** `src/business/{announcement,shareholders-meeting,announcement-popup}/`
**상태:** ✅ 완료 (2026-01-06)

---

#### ⏳ 대기: Sub Domain (5개)
- ⏳ SurveyService
- ⏳ LumirStoryService
- ⏳ VideoGalleryService
- ⏳ EducationManagementService (수강자 상태 관리)
- ⏳ WikiService (파일 시스템 관리)

**예상 작업량:**
- 총 13개 도메인 × 평균 2개 파일 (Service, Module) = 26개 파일
- 예상 시간: 1.5-2시간

---

### Phase 2: Context Layer (CQRS)
Context Layer는 명령(Command)과 쿼리(Query)를 분리합니다.

**구현 범위:**
- Command Handlers (생성, 수정, 삭제, 공개/비공개)
- Query Handlers (조회)
- CQRS 패턴 적용

---

#### ✅ 완료: Phase 2-1 공통 모듈 Context Layer (6개)
- ✅ Employee Commands/Queries
- ✅ Department Commands/Queries
- ✅ Position Commands/Queries
- ✅ Rank Commands/Queries
- ✅ Notification Commands
- ✅ Organization Queries

**구현 위치:** `src/context/common/`
**상태:** ✅ 완료 (2026-01-06)

---

#### ✅ 완료: Phase 2-2 간단한 Core Domain Context Layer (4개)
- ✅ NewsContextModule - 뉴스 CQRS
  - Commands: Create, Update, Delete, Publish, Unpublish
  - Queries: GetAll, Get
- ✅ BrochureContextModule - 브로슈어 CQRS
  - Commands: Create, Update, Delete, Publish, Unpublish
  - Queries: GetAll, Get
- ✅ IRContextModule - IR CQRS
  - Commands: Create, Update, Delete, Publish, Unpublish
  - Queries: GetAll, Get
- ✅ ElectronicNoticeContextModule - 전자공시 CQRS
  - Commands: Create, Update, Delete, Publish, Unpublish
  - Queries: GetAll, Get

**구현 위치:** `src/context/{news,brochure,ir,electronic-notice}/`
**상태:** ✅ 완료 (2026-01-06)

---

#### ✅ 완료: Phase 2-3 복잡한 Core Domain Context Layer (3개)
- ✅ AnnouncementContextModule - 공지사항 CQRS
  - Commands: Create, Update, Delete, UpdateEmployeeResponse, AddEmployee
  - Queries: GetAll, Get, GetEmployeeResponses
- ✅ ShareholdersMeetingContextModule - 주주총회 CQRS
  - Commands: Create, Update, Delete
  - Queries: GetAll, Get
- ✅ AnnouncementPopupContextModule - 팝업 CQRS
  - Commands: Create, Update, Delete, Publish, Unpublish
  - Queries: GetAll, Get

**구현 위치:** `src/context/{announcement,shareholders-meeting,announcement-popup}/`
**상태:** ✅ 완료 (2026-01-06)

---

#### ✅ 완료: Phase 2-4 Sub Domain Context Layer (5개)
- ✅ SurveyContextModule - 설문조사 CQRS
- ✅ LumirStoryContextModule - 루미르 스토리 CQRS
- ✅ VideoGalleryContextModule - 비디오 갤러리 CQRS
- ✅ EducationManagementContextModule - 교육 관리 CQRS
- ✅ WikiContextModule - 위키 CQRS

**구현 위치:** `src/context/{survey,lumir-story,video-gallery,education-management,wiki}/`
**상태:** ✅ 완료 (2026-01-06)

**구현 내역:**
- Survey: 8개 Commands/Queries, 8개 Handlers, 1개 Module
- LumirStory: 7개 Commands/Queries, 7개 Handlers, 1개 Module
- VideoGallery: 7개 Commands/Queries, 7개 Handlers, 1개 Module
- EducationManagement: 8개 Commands/Queries, 8개 Handlers, 1개 Module (+ Business Service 메서드 추가)
- Wiki: 5개 Commands/Queries, 5개 Handlers, 1개 Module

---

## 📁 완성된 프로젝트 구조

```
src/
├── interface/                    # ✅ 완료 (100%)
│   ├── common/                  # 직원, 부서, 알림 등
│   ├── announcement-popup/
│   ├── announcement/
│   ├── news/
│   ├── brochure/
│   ├── ir/
│   ├── shareholders-meeting/
│   ├── electronic-notice/
│   ├── popup/
│   ├── survey/
│   ├── lumir-story/
│   ├── video-gallery/
│   ├── education-management/
│   ├── wiki/
│   ├── decorators/              # 공용 데코레이터
│   └── AGENTS.md               # Interface Layer 코딩 규칙
│
├── business/                    # ✅ 완료 (100%)
│   ├── common/                  # ✅ 공통 모듈 서비스
│   │   ├── employee.service.ts
│   │   ├── department.service.ts
│   │   ├── notification.service.ts
│   │   ├── position.service.ts
│   │   ├── rank.service.ts
│   │   └── organization.service.ts
│   ├── news/                    # ✅ 뉴스 서비스
│   │   └── news.service.ts
│   ├── brochure/                # ✅ 브로슈어 서비스
│   │   └── brochure.service.ts
│   └── ...
│
├── context/                     # ⏳ 진행중 Context Layer (33%)
│   ├── common/
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   ├── news/                    # ✅ 완료
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   ├── brochure/                # ✅ 완료
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   ├── ir/                      # ✅ 완료
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   ├── electronic-notice/       # ✅ 완료
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   └── ...                      # ⏳ 나머지 도메인 대기중
│
├── domain/                      # ✅ 완료 (100%)
│   ├── common/                  # Employee, Department 등
│   ├── core/                    # Core Domain Entities
│   │   ├── common/types/
│   │   ├── announcement-popup/
│   │   ├── announcement/
│   │   ├── news/
│   │   ├── brochure/
│   │   ├── ir/
│   │   ├── shareholders-meeting/
│   │   ├── electronic-notice/
│   │   └── popup/
│   └── sub/                     # Sub Domain Entities
│       ├── survey/
│       ├── education-management/
│       ├── wiki/
│       ├── lumir-story/
│       └── video-gallery/
│
└── libs/                        # 공통 라이브러리
    └── database/base/           # BaseEntity, BaseDTO
```

---

## 📝 구현된 API 예시

### 뉴스 API
```
GET    /api/news                       - 뉴스 목록 조회
GET    /api/news/:id                   - 뉴스 상세 조회
POST   /api/news                       - 뉴스 생성
PUT    /api/news/:id                   - 뉴스 수정
DELETE /api/news/:id                   - 뉴스 삭제
GET    /api/news/categories            - 카테고리 목록 조회
POST   /api/news/categories            - 카테고리 생성
GET    /api/news/languages             - 언어 목록 조회
POST   /api/news/languages             - 언어 생성
GET    /api/news/:id/translations      - 번역 목록 조회
GET    /api/news/:id/translations/:lang - 번역 조회
POST   /api/news/translations          - 번역 생성
PUT    /api/news/:id/translations/:lang - 번역 수정
GET    /api/news/:id/url               - URL 조회
POST   /api/news/urls                  - URL 생성
PUT    /api/news/:id/url               - URL 수정
```

### 설문조사 API
```
GET    /api/surveys                    - 설문조사 목록 조회
GET    /api/surveys/:id                - 설문조사 상세 조회
POST   /api/surveys                    - 설문조사 생성
PUT    /api/surveys/:id                - 설문조사 수정
DELETE /api/surveys/:id                - 설문조사 삭제
GET    /api/surveys/categories         - 카테고리 목록 조회
POST   /api/surveys/categories         - 카테고리 생성
POST   /api/surveys/:id/submit         - 응답 제출
GET    /api/surveys/:id/results        - 결과 조회
```

---

## 📚 참고 문서

- **Interface Layer 규칙**: `src/interface/AGENTS.md`
- **Entity 정의**: `.cursor/rules/entity.mdc`
- **API 명세**: `.cursor/rules/end-points.mdc`
- **프로젝트 아키텍처**: `README.md`

---

**업데이트**: 2026-01-06 04:00
**구현 버전**: v4.0
**상태**: 
- ✅ Interface Layer 완료 (100%)
- ✅ Business Layer 완료 (100%)
- ✅ Context Layer 완료 (100% - 18/18 완료)
  - ✅ Phase 2-1: 공통 모듈 (6/6)
  - ✅ Phase 2-2: 간단한 Core Domain (4/4)
  - ✅ Phase 2-3: 복잡한 Core Domain (3/3)
  - ✅ Phase 2-4: Sub Domain (5/5)
- ✅ Infrastructure Layer 완료 (App Module 통합, 환경 설정)
- ⚠️ **Testing Layer 진행중** (1/12 도메인 완료)
  - ✅ AnnouncementPopup: 단위 테스트 100%, E2E 테스트 60%
  - ⏳ 나머지 11개 도메인 테스트 작성 예정

## 🚀 Phase 3: Infrastructure Layer 완료

### ✅ 완료 항목
1. **AppModule 통합** - 모든 14개 도메인 모듈 등록
2. **환경 변수 설정** - .env.example, .gitignore
3. **TypeORM 설정** - ConfigService 기반 동적 설정
4. **데이터베이스 마이그레이션** - data-source.ts 및 스크립트 추가
5. **Infrastructure 가이드** - docs/INFRASTRUCTURE_GUIDE.md

### 📁 생성된 파일
- `src/app.module.ts` (업데이트)
- `src/data-source.ts` (신규)
- `.gitignore` (업데이트)
- `docs/INFRASTRUCTURE_GUIDE.md` (신규)
- `package.json` (마이그레이션 스크립트 추가)

---

## 🧪 Phase 4: Testing Layer (진행중)

### ✅ 완료 항목 (AnnouncementPopup 도메인)

#### 1. 테스트 인프라 구축 ✅
- ✅ **Testcontainers 통합** - PostgreSQL 15 격리 환경
- ✅ **테스트 헬퍼** - `TestSuiteHelper`, `TestDataBuilder`
- ✅ **Fixture 시스템** - `EmployeeFixture`, `AnnouncementPopupFixture`
- ✅ **Jest 설정** - 단위/E2E 테스트 설정 및 모듈 경로 매핑

#### 2. 테스트 파일 구조 재구성 ✅
- ✅ `src/` → `test/` 폴더로 이동
- ✅ 계층별 디렉토리 구조 생성
  - `test/domain/` - Domain Layer 테스트
  - `test/business/` - Business Layer 테스트
  - `test/context/` - Context Layer 테스트
  - `test/integration/` - Integration 테스트
  - `test/e2e/` - E2E 테스트

#### 3. AnnouncementPopup 도메인 테스트 완료 ✅
| 레이어 | 파일 수 | 테스트 수 | 통과율 | 상태 |
|--------|---------|-----------|--------|------|
| Domain | 1 | 9 | 100% | ✅ |
| Business | 1 | 27 | 100% | ✅ |
| Context | 3 | 9 | 100% | ✅ |
| Integration | 1 | 4 | 100% | ✅ |
| E2E | 5 | 65 | 60% | ⚠️ |
| **합계** | **11** | **114** | **84%** | **⚠️** |

**단위 테스트 결과**:
```bash
✅ Test Suites: 5 passed, 5 total
✅ Tests: 45 passed, 45 total
⏱️ Time: 4.874 s
```

**E2E 테스트 결과**:
```bash
✅ GET /announcement-popups (11/11 통과)
✅ GET /announcement-popups/:id (10/10 통과)
✅ POST /announcement-popups (16/17 통과, 94%)
⚠️ PATCH /announcement-popups/:id (1/15 통과)
⏳ DELETE /announcement-popups/:id (미실행)
```

**주요 수정 사항**:
- ✅ Service Layer에 DTO → Entity 변환 로직 구현 (`managerId` → `Employee` 객체)
- ✅ `CreateAnnouncementPopupDto`에 `releasedAt` 필드 추가
- ⚠️ Tags JSONB 타입 변환 이슈 (PostgreSQL ↔ TypeORM, 1개 테스트 실패)
- ⚠️ PATCH/DELETE 테스트 데이터 생성 이슈 (조사 필요)

#### 4. 생성된 파일 목록 ✅
```
test/
├── domain/core/announcement-popup/
│   └── announcement-popup.entity.spec.ts
├── business/announcement-popup/
│   └── announcement-popup.service.spec.ts
├── context/announcement-popup/handlers/commands/
│   ├── create-announcement-popup.handler.spec.ts
│   ├── update-announcement-popup.handler.spec.ts
│   └── delete-announcement-popup.handler.spec.ts
├── integration/announcement-popup/
│   └── announcement-popup.integration.spec.ts
├── e2e/announcement-popup/
│   ├── get-announcement-popups.e2e-spec.ts
│   ├── get-announcement-popup-by-id.e2e-spec.ts
│   ├── post-announcement-popup.e2e-spec.ts
│   ├── patch-announcement-popup.e2e-spec.ts
│   └── delete-announcement-popup.e2e-spec.ts
├── fixtures/
│   ├── employee.fixture.ts
│   ├── announcement-popup.fixture.ts
│   └── index.ts
├── helpers/
│   ├── test-suite.helper.ts
│   ├── test-data-builder.helper.ts
│   └── index.ts
├── setup.ts
├── TESTING_GUIDE.md
├── TESTING_PLAN.md
└── FINAL_SUMMARY.md
```

### ⚠️ 현재 작업 중

#### 즉시 수정 필요 (우선순위 1)
- ✅ ~~POST E2E 테스트 수정 완료~~ (16/17 통과, 94%)
- ⚠️ **PATCH/DELETE E2E 테스트 수정**
  - 이슈: 테스트 데이터 생성 시 404 에러 발생
  - 영향: PATCH 14/15 실패, DELETE 미실행
  - 조사 필요: TestDataBuilder와 Repository 간의 데이터 생성 프로세스 검증
- ⚠️ **Tags JSONB 타입 변환 이슈**
  - 이슈: PostgreSQL JSONB ↔ TypeORM 간 변환 시 tags가 빈 배열로 저장됨
  - 영향: 1개 POST 테스트 실패
  - 조사 필요: TypeORM Column Transformer 또는 Custom Type 구현

### 📋 다음 계획

#### 단기 목표 (우선순위 2)
1. ✅ ~~테스트 파일 재구조화 완료~~
2. ✅ ~~통합 테스트 구조 생성 완료~~
3. ✅ ~~다른 도메인 테스트 작성 계획 수립 완료~~
4. ⏳ **11개 도메인 테스트 작성 시작**

#### 11개 도메인 테스트 작성 계획 (3-5주)

**Phase 1: 표준 CRUD 도메인 (1-2주)**
- [ ] ElectronicDisclosure (전자공시)
- [ ] IR (투자자 관계)
- [ ] Brochure (브로슈어)
- [ ] News (뉴스)
- [ ] LumirStory (루미르 스토리)
- [ ] VideoGallery (비디오 갤러리)

**예상**: 6개 도메인 × 11개 파일 = 66개 테스트 파일, ~800개 테스트

**Phase 2: 중간 복잡도 도메인 (1주)**
- [ ] ShareholdersMeeting (주주총회) - `ResultOfVote` 특수 처리
- [ ] Announcement (공지사항) - `AnnouncementEmployee` 배열 관리
- [ ] EducationManagement (교육 관리) - `Attendee` 상태 관리

**예상**: 3개 도메인 × 11개 파일 = 33개 테스트 파일, ~400개 테스트

**Phase 3: 고복잡도 도메인 (1-2주)**
- [ ] Survey (설문조사) - `Inquery` 복잡한 구조
- [ ] Wiki (위키) - `WikiFileSystem` 트리 구조

**예상**: 2개 도메인 × 11개 파일 = 22개 테스트 파일, ~300개 테스트

**전체 예상**:
- 총 12개 도메인 (AnnouncementPopup 포함)
- 총 132개 테스트 파일
- 총 ~1,500개 테스트
- 예상 기간: 3-5주

### 📚 테스트 관련 문서
- `test/TESTING_GUIDE.md` - 테스트 작성 가이드
- `test/TESTING_PLAN.md` - 11개 도메인 테스트 작성 계획
- `test/FINAL_SUMMARY.md` - AnnouncementPopup 테스트 완료 요약
- `test/e2e/README.md` - E2E 테스트 케이스 작성 가이드

---

### 🎯 다음 단계

#### 즉시 수정 필요 (우선순위 1)
- ✅ ~~POST E2E 테스트 수정 완료~~ (16/17 통과, 94%)
- ⚠️ PATCH/DELETE E2E 테스트 디버깅 (14개 실패)
  - TestDataBuilder 데이터 생성 프로세스 검증
  - 404 에러 원인 파악 및 해결
- ⚠️ Tags JSONB 타입 변환 이슈 해결 (1개 실패)
  - TypeORM Column Transformer 구현 검토
  - 또는 Custom Type Handler 구현

#### 다음 작업 (우선순위 2)
- 📋 11개 도메인 테스트 작성 (test/TESTING_PLAN.md 참조)
  - Phase 1: 표준 CRUD 도메인 (6개) - 1-2주
  - Phase 2: 중간 복잡도 도메인 (3개) - 1주
  - Phase 3: 고복잡도 도메인 (2개) - 1-2주

#### 향후 계획 (우선순위 3)
- ⏳ PostgreSQL 데이터베이스 설정
- ⏳ 서버 실행 및 Swagger 테스트
- ⏳ JWT 인증/인가 구현
- ⏳ AWS S3 파일 업로드 서비스
