# MongoDB → PostgreSQL 마이그레이션 가이드

## 개요

이 문서는 MongoDB BSON 덤프 파일을 PostgreSQL로 마이그레이션하는 과정을 설명합니다.

## 마이그레이션 매핑

| MongoDB 컬렉션 | PostgreSQL 테이블 | 설명 |
|---------------|------------------|------|
| `categories` | `categories` | 직접 매핑 |
| `news` | `news` | 직접 매핑 |
| `pressreleases` | `news` | news 테이블에 통합 |
| `videos` | `video_galleries` | 이름 변환 |
| `irmaterials` | `irs` | 이름 변환 |
| `managementdisclosures` | `electronic_disclosures` | 이름 변환 |
| `shareholdermeetings` | `shareholders_meetings` | 이름 변환 |
| `notifications` | `main_popups` | main_popups로 변환 |
| `pageviews` | `page_views` | 새 테이블 생성 (통계용) |
| `files` | - | 제외됨 |
| `users` | - | 외부 SSO 사용 (제외됨) |

## 데이터 현황

```
총 컬렉션: 21개
총 데이터 크기: 22.6 MB

주요 데이터:
  - pageviews: 107,260개 문서 (22.5 MB)
  - pressreleases: ~50개 문서 (44 KB)
  - news: ~30개 문서 (17 KB)
  - 기타: 소량 데이터
```

## 마이그레이션 단계

### 1. 사전 준비

데이터베이스 마이그레이션이 완료되었는지 확인:

```bash
npm run migration:show
```

### 2. 백업 생성 (필수)

마이그레이션 전에 반드시 백업을 생성하세요:

```bash
npm run backup
```

또는 스크립트 실행 시 프롬프트에서 백업을 선택할 수 있습니다.

### 3. 마이그레이션 실행

```bash
npm run migration:from-mongodb
```

스크립트 실행 시:
1. BSON 파일 통계를 확인합니다
2. 백업 생성 여부를 묻습니다 (권장)
3. 데이터를 파싱하고 매핑합니다
4. 데이터 유효성을 검증합니다
5. 계속 진행할지 확인을 요청합니다
6. PostgreSQL에 데이터를 삽입합니다
7. 삽입 결과를 검증합니다

### 4. 검증

마이그레이션 후 데이터를 확인:

```sql
-- 레코드 수 확인
SELECT 'categories' as table_name, COUNT(*) FROM categories
UNION ALL
SELECT 'news', COUNT(*) FROM news
UNION ALL
SELECT 'video_galleries', COUNT(*) FROM video_galleries
UNION ALL
SELECT 'irs', COUNT(*) FROM irs
UNION ALL
SELECT 'electronic_disclosures', COUNT(*) FROM electronic_disclosures
UNION ALL
SELECT 'shareholders_meetings', COUNT(*) FROM shareholders_meetings
UNION ALL
SELECT 'main_popups', COUNT(*) FROM main_popups
UNION ALL
SELECT 'page_views', COUNT(*) FROM page_views;

-- 카테고리 관계 확인
SELECT n.id, n.title, c.name as category
FROM news n
LEFT JOIN categories c ON n."categoryId" = c.id
LIMIT 10;

-- 페이지뷰 통계
SELECT 
  "pageName",
  COUNT(*) as views,
  AVG("stayDuration") as avg_duration_ms
FROM page_views
WHERE "stayDuration" IS NOT NULL
GROUP BY "pageName"
ORDER BY views DESC
LIMIT 10;
```

## ObjectId → UUID 변환

MongoDB의 ObjectId는 결정론적 UUID로 변환됩니다:

- 동일한 ObjectId는 항상 동일한 UUID를 생성
- 외래키 관계 유지
- 재실행 시 멱등성 보장

변환 함수:
```typescript
import { v5 as uuidv5 } from 'uuid';
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const uuid = uuidv5(objectId, UUID_NAMESPACE);
```

## BaseEntity 필드

모든 엔티티에는 다음 필드가 추가됩니다:

- `id`: ObjectId에서 변환된 UUID
- `createdAt`: ObjectId 타임스탬프에서 추출
- `updatedAt`: createdAt과 동일 (초기값)
- `createdBy`: null
- `updatedBy`: null
- `version`: 1
- `deletedAt`: null

## 트러블슈팅

### 백업 실패

백업 서비스가 작동하지 않으면 수동으로 백업:

```bash
pg_dump -h localhost -U admin -d cms-db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 데이터 검증 실패

검증 에러가 발생하면:
1. 에러 메시지를 확인하여 문제를 파악
2. BSON 파일의 데이터를 확인
3. 필요시 entity-mapper.ts를 수정

### 대용량 데이터 문제

pageviews 데이터가 너무 크면:
1. 스크립트는 자동으로 배치 처리 (5000개씩)
2. 메모리 부족 시 배치 크기를 줄임

### 롤백

마이그레이션 실패 시:
1. 스크립트는 자동으로 트랜잭션 롤백
2. 수동 롤백이 필요하면 백업에서 복원:

```bash
psql -h localhost -U admin -d cms-db < backup_file.sql
```

## 주의사항

1. **프로덕션 적용 전 테스트**: 개발/스테이징 환경에서 먼저 테스트
2. **백업 필수**: 마이그레이션 전 반드시 백업
3. **서비스 중단**: 프로덕션 적용 시 서비스 중단 고려
4. **재실행**: 스크립트는 멱등하지 않음 (중복 데이터 생성 가능)

## 파일 구조

```
scripts/
  migration/
    - bson-parser.ts          # BSON 파일 파싱
    - entity-mapper.ts        # MongoDB → PostgreSQL 매핑
    - validator.ts            # 데이터 검증
    - migrate-from-mongodb.ts # 메인 마이그레이션 스크립트

src/
  domain/
    sub/
      analytics/
        - page-view.entity.ts    # PageView 엔티티
        - page-view.service.ts   # PageView 서비스
        - page-view.module.ts    # PageView 모듈

  migrations/
    hompage-admin-1/          # MongoDB BSON 덤프 파일
      - categories.bson
      - news.bson
      - pageviews.bson
      - ...
```

## 지원

문제가 발생하면 다음을 확인:
1. BSON 파일이 올바른 위치에 있는지
2. PostgreSQL 연결이 정상인지
3. 필요한 npm 패키지가 설치되었는지 (`bson`, `@types/bson`)
