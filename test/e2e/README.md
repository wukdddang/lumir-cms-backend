# E2E 테스트 가이드

## 개요

이 디렉토리는 Lumir CMS Backend의 E2E (End-to-End) 테스트를 포함합니다.

## 테스트 구조

```
test/
├── e2e/                          # E2E 테스트
│   ├── announcement-popup/       # 공지사항 팝업 E2E 테스트
│   │   ├── get-announcement-popups.e2e-spec.ts
│   │   ├── get-announcement-popup-by-id.e2e-spec.ts
│   │   ├── post-announcement-popup.e2e-spec.ts
│   │   ├── patch-announcement-popup.e2e-spec.ts
│   │   └── delete-announcement-popup.e2e-spec.ts
│   └── ... (다른 도메인 테스트)
├── fixtures/                     # 테스트 데이터 픽스처
│   ├── employee.fixture.ts
│   ├── announcement-popup.fixture.ts
│   └── index.ts
├── helpers/                      # 테스트 헬퍼 유틸리티
│   ├── test-suite.helper.ts
│   ├── test-data-builder.helper.ts
│   └── index.ts
├── setup.ts                      # Jest 글로벌 설정
├── jest-e2e.json                 # Jest E2E 설정
└── README.md                     # 이 파일
```

## 테스트 실행

### 전체 E2E 테스트 실행

```bash
npm run test:e2e
```

### 특정 도메인 테스트 실행

```bash
# 공지사항 팝업 테스트만 실행
npm run test:e2e -- --testPathPattern=announcement-popup

# 특정 파일만 실행
npm run test:e2e -- --testPathPattern=get-announcement-popups
```

### Watch 모드

```bash
npm run test:e2e:watch
```

### 커버리지 포함

```bash
npm run test:e2e:cov
```

## 테스트 작성 가이드

### 1. 기본 테스트 구조

```typescript
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestSuiteHelper, TestDataBuilder } from '../../helpers';

describe('GET /endpoint (E2E)', () => {
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
    it('정상적으로 동작해야 한다', async () => {
      // Given: 테스트 데이터 준비
      // When: API 호출
      // Then: 결과 검증
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 요청 시 에러를 반환해야 한다', async () => {
      // ...
    });
  });
});
```

### 2. 픽스처 사용

```typescript
// 테스트 데이터 생성
const employee = EmployeeFixture.기본_직원을_생성한다();
const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();

// 커스텀 데이터 생성
const customPopup = AnnouncementPopupFixture.커스텀_팝업을_생성한다({
  title: '커스텀 제목',
  isPublic: true,
});
```

### 3. 데이터베이스에 직접 데이터 생성

```typescript
// TestDataBuilder 사용
const popup = await testDataBuilder.공지사항_팝업을_생성한다();

// 커스텀 데이터
const customPopup = await testDataBuilder.공지사항_팝업을_생성한다({
  title: '테스트 팝업',
  isPublic: true,
});

// 여러 데이터 생성
const popups = await testDataBuilder.여러_공지사항_팝업을_생성한다(10);
```

### 4. API 테스트 패턴

```typescript
// GET 요청
const response = await request(app.getHttpServer())
  .get('/announcement-popups')
  .expect(200);

// POST 요청
const response = await request(app.getHttpServer())
  .post('/announcement-popups')
  .send(createDto)
  .expect(201);

// PATCH 요청
const response = await request(app.getHttpServer())
  .patch(`/announcement-popups/${id}`)
  .send(updateDto)
  .expect(200);

// DELETE 요청
await request(app.getHttpServer())
  .delete(`/announcement-popups/${id}`)
  .expect(204);
```

### 5. 응답 검증 패턴

```typescript
// 정확한 매칭
expect(response.body.title).toBe('예상 제목');

// 객체 매칭
expect(response.body).toMatchObject({
  id: expect.any(String),
  title: expect.any(String),
  createdAt: expect.any(String),
});

// 배열 검증
expect(response.body).toHaveLength(3);
expect(response.body).toBeInstanceOf(Array);

// 날짜 형식 검증
expect(() => new Date(response.body.createdAt)).not.toThrow();
```

## 테스트 케이스 체크리스트

### GET 엔드포인트

- [ ] 정상 조회
- [ ] 빈 결과 처리
- [ ] 관계 데이터 포함 확인
- [ ] 정렬 확인
- [ ] 존재하지 않는 ID (404)
- [ ] 잘못된 UUID 형식 (400)

### POST 엔드포인트

- [ ] 유효한 데이터로 생성
- [ ] 최소 필수 데이터로 생성
- [ ] 필수 필드 누락 (400)
- [ ] 잘못된 데이터 타입 (400)
- [ ] 중복 데이터 (409)
- [ ] 경계값 테스트
- [ ] 생성 후 조회 가능 확인

### PATCH 엔드포인트

- [ ] 부분 업데이트
- [ ] 여러 필드 동시 업데이트
- [ ] 존재하지 않는 ID (404)
- [ ] 잘못된 데이터 타입 (400)
- [ ] 수정되지 않은 필드 유지 확인
- [ ] updatedAt 갱신 확인

### DELETE 엔드포인트

- [ ] 정상 삭제
- [ ] 삭제 후 조회 불가 확인
- [ ] 존재하지 않는 ID (404)
- [ ] 이미 삭제된 데이터 재삭제 (404)
- [ ] Soft Delete 확인
- [ ] 관계 데이터 유지 확인

## 주의사항

### 1. 데이터 격리

- 각 테스트는 독립적이어야 합니다
- `beforeEach`에서 데이터베이스를 정리합니다
- 테스트 간 의존성이 없어야 합니다

### 2. 비동기 처리

- 모든 데이터베이스 작업은 `await` 사용
- 테스트 타임아웃 설정 (기본 5초)
- 긴 작업은 타임아웃 증가: `it('...', async () => {...}, 10000)`

### 3. 에러 처리

- HTTP 상태 코드 정확히 검증
- 에러 메시지 검증 (선택적)
- 여러 상태 코드 허용 시 명시: `expect([400, 404]).toContain(response.status)`

### 4. 성능

- 대용량 데이터 테스트는 필요시에만
- 불필요한 데이터 생성 최소화
- 병렬 실행 고려

## 헬퍼 유틸리티

### TestSuiteHelper

애플리케이션 초기화 및 정리를 담당합니다.

```typescript
const testSuite = new TestSuiteHelper();
await testSuite.initializeApp();
await testSuite.cleanupBeforeTest();
await testSuite.closeApp();
```

### TestDataBuilder

데이터베이스에 테스트 데이터를 생성합니다.

```typescript
const builder = new TestDataBuilder(dataSource);
await builder.직원을_생성한다();
await builder.공지사항_팝업을_생성한다();
await builder.여러_공지사항_팝업을_생성한다(10);
```

### Fixtures

메모리에서 테스트 데이터를 생성합니다.

```typescript
const employee = EmployeeFixture.기본_직원을_생성한다();
const popup = AnnouncementPopupFixture.초안_팝업을_생성한다();
```

## 트러블슈팅

### 테스트가 실패하는 경우

1. 데이터베이스 연결 확인
2. Docker 컨테이너 상태 확인
3. 환경 변수 설정 확인
4. 로그 레벨 조정: `LOG_LEVEL=debug npm run test:e2e`

### 테스트가 느린 경우

1. 불필요한 데이터 생성 제거
2. 병렬 실행 활성화
3. Testcontainers 재사용 고려

### 간헐적 실패

1. 동시성 문제 확인
2. 타임아웃 증가
3. 테스트 순서 의존성 제거

## 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [Supertest 공식 문서](https://github.com/visionmedia/supertest)
- [NestJS 테스팅 가이드](https://docs.nestjs.com/fundamentals/testing)
- [Testcontainers 공식 문서](https://testcontainers.com/)
