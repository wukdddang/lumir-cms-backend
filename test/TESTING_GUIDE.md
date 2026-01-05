# 루미르 CMS 백엔드 테스팅 가이드

## 목차

1. [개요](#개요)
2. [테스트 계층 구조](#테스트-계층-구조)
3. [테스트 실행](#테스트-실행)
4. [레이어별 테스트 가이드](#레이어별-테스트-가이드)
5. [테스트 작성 패턴](#테스트-작성-패턴)
6. [테스트 유틸리티](#테스트-유틸리티)

## 개요

이 프로젝트는 **4-Layer Architecture**를 따르며, 각 레이어별로 적절한 테스트 전략을 적용합니다:

- **Domain Layer**: 단위 테스트 (Entity 로직)
- **Business Layer**: 단위 테스트 (Service, Repository 모킹)
- **Context Layer**: 단위 테스트 (CQRS Handler, Service 모킹)
- **Interface Layer**: E2E 테스트 (Controller, 실제 HTTP 요청)

## 테스트 계층 구조

```
프로젝트 루트/
├── src/
│   ├── domain/
│   │   └── core/
│   │       └── announcement-popup/
│   │           ├── announcement-popup.entity.ts
│   │           └── announcement-popup.entity.spec.ts       # 단위 테스트
│   ├── business/
│   │   └── announcement-popup/
│   │       ├── announcement-popup.service.ts
│   │       └── announcement-popup.service.spec.ts          # 단위 테스트
│   ├── context/
│   │   └── announcement-popup/
│   │       └── handlers/
│   │           └── commands/
│   │               ├── create-announcement-popup.handler.ts
│   │               └── create-announcement-popup.handler.spec.ts  # 단위 테스트
│   └── interface/
│       └── announcement-popup/
│           └── announcement-popup.controller.ts
└── test/
    ├── e2e/
    │   └── announcement-popup/
    │       ├── get-announcement-popups.e2e-spec.ts         # E2E 테스트
    │       ├── post-announcement-popup.e2e-spec.ts
    │       └── ...
    ├── fixtures/                                            # 테스트 데이터
    │   ├── employee.fixture.ts
    │   └── announcement-popup.fixture.ts
    └── helpers/                                             # 테스트 헬퍼
        ├── test-suite.helper.ts
        └── test-data-builder.helper.ts
```

## 테스트 실행

### 모든 테스트 실행

```bash
# 단위 테스트 + E2E 테스트
npm test

# 단위 테스트만
npm run test:unit

# E2E 테스트만
npm run test:e2e
```

### 특정 테스트 실행

```bash
# 특정 파일 패턴
npm test -- --testPathPattern=announcement-popup

# 특정 describe 블록
npm test -- --testNamePattern="성공 케이스"

# 단일 파일
npm test -- src/domain/core/announcement-popup/announcement-popup.entity.spec.ts
```

### Watch 모드

```bash
npm run test:watch
npm run test:e2e:watch
```

### 커버리지

```bash
npm run test:cov
npm run test:e2e:cov
```

## 레이어별 테스트 가이드

### 1. Domain Layer (Entity) - 단위 테스트

**목적**: Entity의 비즈니스 로직과 메서드가 올바르게 동작하는지 검증

**테스트 대상**:
- 생성자
- 도메인 메서드 (`공개한다`, `비공개한다`, `상태를_변경한다`)
- DTO 변환 메서드 (`DTO로_변환한다`)
- Getter 메서드 (computed properties)

**예시**:

```typescript
// src/domain/core/announcement-popup/announcement-popup.entity.spec.ts
describe('AnnouncementPopup Entity', () => {
  describe('공개한다', () => {
    it('팝업을 공개 상태로 변경해야 한다', () => {
      // Given
      const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
      
      // When
      popup.공개한다();
      
      // Then
      expect(popup.isPublic).toBe(true);
      expect(popup.releasedAt).toBeInstanceOf(Date);
    });
  });
});
```

**특징**:
- 외부 의존성 없음 (순수 로직 테스트)
- 빠른 실행 속도
- 픽스처 사용으로 데이터 준비

### 2. Business Layer (Service) - 단위 테스트

**목적**: Service의 비즈니스 로직과 Repository 호출이 올바른지 검증

**테스트 대상**:
- CRUD 메서드
- Repository 호출 검증
- 에러 처리
- 데이터 변환

**예시**:

```typescript
// src/business/announcement-popup/announcement-popup.service.spec.ts
describe('AnnouncementPopupService', () => {
  let service: AnnouncementPopupService;
  let repository: jest.Mocked<Repository<AnnouncementPopup>>;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AnnouncementPopupService,
        { provide: getRepositoryToken(AnnouncementPopup), useValue: mockRepository },
      ],
    }).compile();

    service = module.get(AnnouncementPopupService);
    repository = module.get(getRepositoryToken(AnnouncementPopup));
  });

  it('팝업_목록을_조회_한다', async () => {
    // Given
    const popups = AnnouncementPopupFixture.여러_팝업을_생성한다(3);
    repository.find.mockResolvedValue(popups);

    // When
    const result = await service.팝업_목록을_조회_한다();

    // Then
    expect(repository.find).toHaveBeenCalledWith({
      relations: ['manager'],
      order: { createdAt: 'DESC' },
    });
    expect(result.data).toHaveLength(3);
  });
});
```

**특징**:
- Repository를 모킹하여 데이터베이스 격리
- Service 로직만 집중 테스트
- 의존성 주입 검증

### 3. Context Layer (Handler) - 단위 테스트

**목적**: CQRS Handler가 Command/Query를 올바르게 처리하고 Service를 호출하는지 검증

**테스트 대상**:
- Command/Query 실행
- Service 메서드 호출 검증
- 에러 전파

**예시**:

```typescript
// src/context/announcement-popup/handlers/commands/create-announcement-popup.handler.spec.ts
describe('CreateAnnouncementPopupHandler', () => {
  let handler: CreateAnnouncementPopupHandler;
  let popupService: jest.Mocked<AnnouncementPopupService>;

  beforeEach(async () => {
    const mockPopupService = {
      팝업을_생성_한다: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CreateAnnouncementPopupHandler,
        { provide: AnnouncementPopupService, useValue: mockPopupService },
      ],
    }).compile();

    handler = module.get(CreateAnnouncementPopupHandler);
    popupService = module.get(AnnouncementPopupService);
  });

  it('CreateAnnouncementPopupCommand를 실행하여 팝업을 생성해야 한다', async () => {
    // Given
    const command = new CreateAnnouncementPopupCommand('새 팝업');
    const response = successResponse(/* ... */);
    popupService.팝업을_생성_한다.mockResolvedValue(response);

    // When
    const result = await handler.execute(command);

    // Then
    expect(popupService.팝업을_생성_한다).toHaveBeenCalledWith({
      title: '새 팝업',
      // ...
    });
    expect(result.success).toBe(true);
  });
});
```

**특징**:
- Service를 모킹하여 격리
- Command/Query 매핑 검증
- 얇은 레이어 (로직 없음)

### 4. Interface Layer (Controller) - E2E 테스트

**목적**: 실제 HTTP 요청/응답이 올바르게 동작하는지 전체 플로우 검증

**테스트 대상**:
- HTTP 엔드포인트
- 요청 검증 (DTO)
- 응답 형식
- 상태 코드
- 에러 처리

**예시**:

```typescript
// test/e2e/announcement-popup/get-announcement-popups.e2e-spec.ts
describe('GET /announcement-popups (E2E)', () => {
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

  it('모든 공지사항 팝업을 조회해야 한다', async () => {
    // Given
    await testDataBuilder.여러_공지사항_팝업을_생성한다(3);

    // When
    const response = await request(app.getHttpServer())
      .get('/announcement-popups')
      .expect(200);

    // Then
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('title');
  });
});
```

**특징**:
- 실제 데이터베이스 사용 (Testcontainers)
- 전체 애플리케이션 통합 테스트
- 실제 HTTP 요청/응답
- 느린 실행 속도

## 테스트 작성 패턴

### Given-When-Then 패턴

모든 테스트는 Given-When-Then 패턴을 따릅니다:

```typescript
it('설명', async () => {
  // Given: 테스트 준비 (데이터, 모킹)
  const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
  
  // When: 테스트 실행
  const result = popup.공개한다();
  
  // Then: 결과 검증
  expect(popup.isPublic).toBe(true);
});
```

### 테스트 구조화

```typescript
describe('클래스명 또는 엔드포인트', () => {
  describe('메서드명 또는 케이스', () => {
    it('구체적인 동작을 설명한다', () => {
      // ...
    });
  });
  
  describe('성공 케이스', () => {
    // 정상 동작 테스트
  });
  
  describe('실패 케이스', () => {
    // 에러 케이스 테스트
  });
  
  describe('경계값 테스트', () => {
    // 최소/최대값 테스트
  });
});
```

## 테스트 유틸리티

### Fixtures

메모리에서 테스트 데이터를 생성합니다.

```typescript
// test/fixtures/announcement-popup.fixture.ts
export class AnnouncementPopupFixture {
  static 초안_팝업을_생성한다(): AnnouncementPopup { /* ... */ }
  static 공개_팝업을_생성한다(): AnnouncementPopup { /* ... */ }
  static 커스텀_팝업을_생성한다(partial): AnnouncementPopup { /* ... */ }
}
```

**사용 시기**: 단위 테스트

### TestDataBuilder

데이터베이스에 실제 데이터를 생성합니다.

```typescript
// test/helpers/test-data-builder.helper.ts
export class TestDataBuilder {
  async 공지사항_팝업을_생성한다(partial?): Promise<AnnouncementPopup> { /* ... */ }
  async 여러_공지사항_팝업을_생성한다(count): Promise<AnnouncementPopup[]> { /* ... */ }
}
```

**사용 시기**: E2E 테스트

### TestSuiteHelper

애플리케이션 초기화 및 정리를 담당합니다.

```typescript
// test/helpers/test-suite.helper.ts
export class TestSuiteHelper {
  async initializeApp(): Promise<INestApplication> { /* ... */ }
  async cleanupBeforeTest(): Promise<void> { /* ... */ }
  async closeApp(): Promise<void> { /* ... */ }
}
```

**사용 시기**: E2E 테스트

## 베스트 프랙티스

### 1. 테스트 격리

- 각 테스트는 독립적이어야 합니다
- `beforeEach`에서 데이터 초기화
- 테스트 간 공유 상태 없음

### 2. 명확한 테스트 설명

```typescript
// ❌ 나쁜 예
it('works', () => {});

// ✅ 좋은 예
it('공개된 팝업은 isPublic이 true이고 releasedAt이 설정되어야 한다', () => {});
```

### 3. 하나의 테스트, 하나의 검증

```typescript
// ❌ 나쁜 예
it('팝업을 생성하고 수정하고 삭제한다', () => {});

// ✅ 좋은 예
it('팝업을 생성해야 한다', () => {});
it('팝업을 수정해야 한다', () => {});
it('팝업을 삭제해야 한다', () => {});
```

### 4. 적절한 모킹

- 단위 테스트: 모든 의존성 모킹
- E2E 테스트: 모킹 최소화

### 5. 에러 케이스 테스트

```typescript
it('존재하지 않는 ID로 조회 시 에러를 발생시켜야 한다', async () => {
  await expect(service.팝업을_조회_한다('non-existent-id'))
    .rejects.toThrow('팝업을 찾을 수 없습니다');
});
```

## 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [NestJS 테스팅](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
