# 뉴스(News) ERD 검증 문서

> 📋 **목적**: 뉴스 시나리오에 맞게 ERD가 올바르게 설계되었는지 검증하고, 피그마 작성을 위한 기초 자료로 사용

**작성일**: 2026년 1월 19일  
**버전**: v1.0

---

## 목차

1. [뉴스 시나리오 요구사항](#1-뉴스-시나리오-요구사항)
2. [현재 ERD 구조 분석](#2-현재-erd-구조-분석)
3. [시나리오별 ERD 검증](#3-시나리오별-erd-검증)
4. [검증 결과 요약](#4-검증-결과-요약)
5. [결론](#5-결론)

---

## 1. 뉴스 시나리오 요구사항

### 1.1 API 엔드포인트 기반 기능 요구사항

```
✅ 뉴스_목록을_조회한다 (페이징)
✅ 뉴스_전체_목록을_조회한다
✅ 뉴스_카테고리_목록을_조회한다
✅ 뉴스를_생성한다
✅ 뉴스_상세_조회한다
✅ 뉴스를_수정한다 (파일 포함)
✅ 뉴스_공개를_수정한다
✅ 뉴스_오더를_일괄_수정한다
✅ 뉴스를_삭제한다
✅ 뉴스_카테고리를_생성한다
✅ 뉴스_카테고리를_수정한다
✅ 뉴스_카테고리_오더를_변경한다
✅ 뉴스_카테고리를_삭제한다
```

### 1.2 핵심 비즈니스 시나리오 (통합 테이블)

| 시나리오 | API 엔드포인트 | 관련 엔티티 | 주요 필드/기능 | 데이터 흐름 |
|---------|---------------|------------|---------------|------------|
| **1. 뉴스 생성** | `POST /admin/news` | • News | • `News.title`<br>• `News.description`<br>• `News.url` (외부 링크)<br>• `News.isPublic` (기본값: true)<br>• `News.attachments` (JSONB) | 1. News 생성<br>2. 파일 S3 업로드<br>3. attachments JSONB 저장<br>4. url 저장 (외부 뉴스 링크) |
| **2. 뉴스 수정** | `PUT /admin/news/:id` | • News | • 제목/설명 업데이트<br>• url 수정<br>• attachments 완전 교체<br>• AWS S3 연동 | 1. News 업데이트<br>2. 기존 파일 S3 삭제<br>3. 새 파일 S3 업로드<br>4. attachments 교체 |
| **3. 공개 상태 관리** | `PATCH /admin/news/:id/public` | • News | • `isPublic` (boolean)<br>• 즉시 공개/비공개 제어<br>• 복잡한 상태 관리 없음 | 1. `isPublic` 필드만 업데이트<br>2. 즉시 반영 (워크플로우 없음) |
| **4. 카테고리 관리** | `POST /admin/news/categories`<br>`PATCH /admin/news/:id/categories` | • Category<br>• CategoryMapping<br>• News | • `Category.entityType` = 'news'<br>• `CategoryMapping` (다대다)<br>• UK: (entityId, categoryId) | 1. Category 생성<br>2. CategoryMapping 추가/삭제<br>3. 뉴스 ↔ 카테고리 연결 |
| **5. 정렬 순서 관리** | `PUT /admin/news/batch-order` | • News | • `order` (int)<br>• 배치 업데이트 지원 | 1. 여러 뉴스의 order 값 일괄 변경<br>2. 트랜잭션으로 일관성 보장 |
| **6. 외부 링크 관리** | `POST /admin/news`<br>`PUT /admin/news/:id` | • News | • `url` (text nullable)<br>• 외부 뉴스 기사 URL<br>• 상세 페이지 링크 | 1. url 저장<br>2. 외부 뉴스 원본 연결<br>3. 클릭 시 외부 페이지 이동 |
| **7. 첨부파일 관리** | `POST/PUT /admin/news` | • News | • `attachments` (JSONB)<br>• 파일 메타데이터 저장<br>• S3 URL 참조<br>• PDF/JPG/PNG/WEBP | 1. 파일 S3 업로드<br>2. attachments JSONB 저장<br>3. 수정 시 기존 파일 삭제 후 교체 |

### 1.3 상세 시나리오 (코드 예시)

<details>
<summary>📝 시나리오 1: 뉴스 생성 - 코드 예시</summary>

```typescript
// 관리자가 새로운 뉴스를 등록
POST /admin/news
{
  "title": "루미르, 신제품 출시",
  "description": "루미르가 혁신적인 신제품을 출시했습니다.",
  "url": "https://news.example.com/lumir-new-product",
  "files": [File, File, ...]  // PDF, JPG, PNG, WEBP
}

// DB 저장 시:
// - News 레코드 생성
// - isPublic: true (기본값, 즉시 공개)
// - order: 자동 계산 (최대값 + 1)
// - attachments JSONB 저장
// - url 저장 (외부 뉴스 기사 링크)
```
</details>

<details>
<summary>📝 시나리오 2: 뉴스 수정 (파일 포함) - 코드 예시</summary>

```typescript
// 기존 뉴스의 내용과 파일을 수정
PUT /admin/news/:id
{
  "title": "루미르, 신제품 출시 (업데이트)",
  "description": "최신 정보로 업데이트된 내용입니다.",
  "url": "https://news.example.com/lumir-new-product-updated",
  "files": [File, ...]  // 새로운 파일로 완전 교체
}

// ⚠️ 중요: 파일 관리 방식
// - files를 전송하면: 기존 파일 전부 삭제 → 새 파일들로 교체
// - files를 전송하지 않으면: 기존 파일 전부 삭제 (파일 없음)
// - 기존 파일을 유지하려면 반드시 해당 파일을 다시 전송해야 함
```
</details>

<details>
<summary>📝 시나리오 3: 공개 상태 관리 - 코드 예시</summary>

```typescript
// 뉴스 공개/비공개 설정
PATCH /admin/news/:id/public
{
  "isPublic": false  // 즉시 비공개로 전환
}
```
</details>

<details>
<summary>📝 시나리오 4: 카테고리 관리 - 코드 예시</summary>

```typescript
// 뉴스 카테고리 생성
POST /admin/news/categories
{
  "name": "제품 출시",
  "description": "신제품 출시 관련 뉴스",
  "isActive": true,
  "order": 1
}

// 뉴스에 카테고리 할당
PATCH /admin/news/:id/categories
{
  "categoryIds": ["category-uuid-1", "category-uuid-2"]
}
```
</details>

<details>
<summary>📝 시나리오 5: 정렬 순서 관리 - 코드 예시</summary>

```typescript
// 여러 뉴스의 순서를 한 번에 변경
PUT /admin/news/batch-order
{
  "news": [
    { "id": "uuid-1", "order": 1 },
    { "id": "uuid-2", "order": 2 },
    { "id": "uuid-3", "order": 3 }
  ]
}
```
</details>

<details>
<summary>📝 시나리오 6: 외부 링크 관리 - 코드 예시</summary>

```typescript
// 외부 뉴스 기사 링크 저장
POST /admin/news
{
  "title": "루미르, 글로벌 시장 진출",
  "description": "루미르가 해외 시장 진출을 발표했습니다.",
  "url": "https://www.news-site.com/article/lumir-global-expansion"
}

// url 필드:
// - text 타입 (nullable)
// - 외부 뉴스 기사 원본 URL
// - 클릭 시 외부 페이지로 이동
// - 원본 기사 보기 기능
```
</details>

<details>
<summary>📝 시나리오 7: 첨부파일 관리 - JSONB 구조</summary>

```typescript
// attachments JSONB 구조
{
  attachments: [
    {
      fileName: "press_release.pdf",
      fileUrl: "https://s3.amazonaws.com/lumir-cms/news/press_release.pdf",
      fileSize: 512000,
      mimeType: "application/pdf"
    },
    {
      fileName: "product_image.jpg",
      fileUrl: "https://s3.amazonaws.com/lumir-cms/news/product_image.jpg",
      fileSize: 204800,
      mimeType: "image/jpeg"
    },
    {
      fileName: "infographic.webp",
      fileUrl: "https://s3.amazonaws.com/lumir-cms/news/infographic.webp",
      fileSize: 153600,
      mimeType: "image/webp"
    }
  ]
}
```

**검증 포인트**:
- ✅ attachments JSONB로 파일 메타데이터 저장
- ✅ AWS S3 URL 참조
- ✅ 파일 크기, MIME 타입 저장
- ✅ 4가지 파일 타입 지원 (PDF, JPG, PNG, WEBP)
</details>

---

## 2. 현재 ERD 구조 분석

### 2.1 뉴스 통합 ERD

```mermaid
erDiagram
    %% Core Entity
    News {
        uuid id PK
        varchar title "제목 (최대 500자)"
        text description "nullable - 설명"
        text url "nullable - 외부 링크 또는 상세 페이지 URL"
        boolean isPublic "공개 여부 (기본값: true)"
        jsonb attachments "nullable - 첨부파일 목록"
        int order "정렬 순서"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable - Soft Delete"
        uuid createdBy "nullable - SSO 직원 ID"
        uuid updatedBy "nullable - SSO 직원 ID"
        int version "Optimistic Locking"
    }
    
    %% Category Entity
    Category {
        uuid id PK
        varchar entityType "news"
        varchar name "카테고리 이름"
        text description "nullable - 설명"
        boolean isActive "활성화 여부"
        int order "정렬 순서"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable"
        uuid updatedBy "nullable"
        int version
    }
    
    %% Mapping Entity
    CategoryMapping {
        uuid id PK
        uuid entityId "News ID - UK: (entityId, categoryId)"
        uuid categoryId UK "FK"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "nullable"
        uuid createdBy "nullable"
        uuid updatedBy "nullable"
        int version
    }
    
    %% Relationships
    News ||--o{ CategoryMapping : "has categories (1:N)"
    CategoryMapping }o--|| Category : "references (N:1)"
```

### 2.2 엔티티별 필드 분석

#### News (뉴스)
- ✅ `id` (uuid) - Primary Key
- ✅ `title` (varchar 500) - 제목
- ✅ `description` (text nullable) - 설명
- ✅ `url` (text nullable) - 외부 링크 또는 뉴스 기사 URL
- ✅ `isPublic` (boolean) - 공개/비공개 즉시 제어 (기본값: true)
- ✅ `attachments` (jsonb) - 첨부파일 메타데이터 (파일명, URL, 크기, MIME 타입)
- ✅ `order` (int) - 정렬 순서
- ✅ `createdAt`, `updatedAt` - 생성/수정 일시
- ✅ `deletedAt` - Soft Delete 지원
- ✅ `createdBy`, `updatedBy` - 생성자/수정자 (외부 SSO 시스템 직원 ID)
- ✅ `version` - 동시성 제어 (Optimistic Locking)

**JSONB 구조 (attachments)**:
```typescript
attachments: [
  {
    fileName: "press_release.pdf",
    fileUrl: "https://s3.amazonaws.com/lumir-cms/news/press_release.pdf",
    fileSize: 512000,  // bytes
    mimeType: "application/pdf"
  },
  {
    fileName: "product_image.jpg",
    fileUrl: "https://s3.amazonaws.com/lumir-cms/news/product_image.jpg",
    fileSize: 204800,
    mimeType: "image/jpeg"
  }
]
```

**지원 파일 타입**:
- ✅ `PDF` - application/pdf
- ✅ `JPG/JPEG` - image/jpeg
- ✅ `PNG` - image/png
- ✅ `WEBP` - image/webp

**인덱스**:
- ✅ `idx_news_is_public` - 공개/비공개 필터링
- ✅ `idx_news_order` - 정렬 순서 조회

#### Category & CategoryMapping (카테고리)
- ✅ `entityType` (varchar) - 도메인 구분 (news)
- ✅ `name`, `description` - 카테고리 정보
- ✅ `isActive` (boolean) - 활성화 여부
- ✅ `order` (int) - 정렬 순서

**특징**:
- ✅ 통합 카테고리 테이블 (entityType으로 도메인 구분)
- ✅ 다대다 관계 (하나의 뉴스는 여러 카테고리에 속할 수 있음)
- ✅ `(entityId, categoryId)` 복합 유니크 키 - 중복 방지

---

## 3. 시나리오별 ERD 검증

### 3.1 검증 결과 요약 테이블

| 시나리오 | 관련 테이블 | 사용 필드 | SQL 작업 | 검증 결과 | 비고 |
|---------|-----------|---------|----------|-----------|------|
| **1. 뉴스 생성** | • News | • `title`, `description`<br>• `url` (외부 링크)<br>• `attachments` (JSONB)<br>• `isPublic` (기본값: true)<br>• `order` | INSERT (1개 테이블) | ✅ **통과** | 다국어 지원 없음<br>한국어만 사용<br>외부 링크 관리 |
| **2. 뉴스 수정** | • News | • `title`, `description` (업데이트)<br>• `url` (업데이트)<br>• `attachments` (교체) | UPDATE (1개 테이블) | ✅ **통과** | 파일 완전 교체 방식<br>기존 파일 S3 삭제 필요 |
| **3. 공개 상태 관리** | • News | • `isPublic` (boolean) | UPDATE (1개 필드) | ✅ **통과** | 복잡한 상태 관리 없음<br>(ContentStatus 제거됨) |
| **4. 카테고리 관리** | • Category<br>• CategoryMapping | • `entityType` = 'news'<br>• UK: (entityId, categoryId) | INSERT, DELETE (매핑) | ✅ **통과** | 다대다 관계 정규화<br>중복 방지 |
| **5. 정렬 순서 관리** | • News | • `order` (int) | UPDATE (배치) | ✅ **통과** | 트랜잭션으로<br>일괄 처리 가능 |
| **6. 외부 링크 관리** | • News | • `url` (text nullable)<br>• 외부 뉴스 기사 URL | UPDATE (1개 필드) | ✅ **통과** | 원본 기사 연결<br>클릭 시 외부 페이지 이동 |
| **7. 첨부파일 관리** | • News | • `attachments` (JSONB)<br>&nbsp;&nbsp;- fileName<br>&nbsp;&nbsp;- fileUrl (S3)<br>&nbsp;&nbsp;- fileSize<br>&nbsp;&nbsp;- mimeType | UPDATE (JSONB) | ✅ **통과** | AWS S3 URL 참조<br>4가지 파일 타입 지원 |

### 3.2 상세 데이터 흐름 (접기/펴기)

<details>
<summary><strong>📊 시나리오 1: 뉴스 생성 - 상세 SQL</strong></summary>

```sql
-- 1. 뉴스 생성
INSERT INTO news (
  id, 
  title, 
  description, 
  url,
  is_public, 
  attachments, 
  "order", 
  created_by
)
VALUES (
  'news-uuid', 
  '루미르, 신제품 출시',
  '루미르가 혁신적인 신제품을 출시했습니다.',
  'https://news.example.com/lumir-new-product',
  true,
  '[
    {
      "fileName": "press_release.pdf",
      "fileUrl": "https://s3.amazonaws.com/lumir-cms/news/press_release.pdf",
      "fileSize": 512000,
      "mimeType": "application/pdf"
    }
  ]'::jsonb,
  0,
  'admin-uuid'
);
```

**검증 포인트**:
- ✅ News 엔티티에 모든 필수 필드 존재
- ✅ 다국어 지원 없음 (한국어만 사용)
- ✅ url 필드로 외부 뉴스 기사 연결
- ✅ attachments JSONB로 파일 메타데이터 저장
- ✅ 4가지 파일 타입 지원 (PDF, JPG, PNG, WEBP)
</details>

<details>
<summary><strong>📊 시나리오 2: 뉴스 수정 (파일 포함) - 상세 SQL</strong></summary>

```sql
-- 1. 뉴스 수정
UPDATE news
SET 
  title = '루미르, 신제품 출시 (업데이트)',
  description = '최신 정보로 업데이트된 내용입니다.',
  url = 'https://news.example.com/lumir-new-product-updated',
  attachments = '[
    {
      "fileName": "updated_release.pdf",
      "fileUrl": "https://s3.amazonaws.com/lumir-cms/news/updated_release.pdf",
      "fileSize": 614400,
      "mimeType": "application/pdf"
    }
  ]'::jsonb,
  updated_at = NOW(),
  updated_by = 'admin-uuid'
WHERE id = 'news-uuid';
```

**검증 포인트**:
- ✅ 제목/설명 수정 가능
- ✅ url 필드 수정으로 외부 링크 변경
- ✅ attachments JSONB 필드로 파일 완전 교체 지원
- ✅ 기존 파일은 S3에서 별도 삭제 필요
</details>

<details>
<summary><strong>📊 시나리오 3: 공개 상태 관리 - 상세 SQL</strong></summary>

```sql
-- 공개/비공개 즉시 변경
UPDATE news
SET is_public = false, updated_at = NOW()
WHERE id = 'news-uuid';
```

**검증 포인트**:
- ✅ `isPublic` 필드로 즉시 공개/비공개 제어
- ✅ 기본값 `true`로 생성 시 즉시 공개
- ✅ 복잡한 상태 관리(ContentStatus) 제거됨
</details>

<details>
<summary><strong>📊 시나리오 4: 카테고리 관리 - 상세 SQL</strong></summary>

```sql
-- 1. 카테고리 생성
INSERT INTO categories (id, entity_type, name, description, is_active, "order")
VALUES ('category-uuid', 'news', '제품 출시', '신제품 출시 관련 뉴스', true, 1);

-- 2. 뉴스에 카테고리 매핑
INSERT INTO category_mappings (id, entity_id, category_id)
VALUES ('mapping-uuid-1', 'news-uuid', 'category-uuid-1');

INSERT INTO category_mappings (id, entity_id, category_id)
VALUES ('mapping-uuid-2', 'news-uuid', 'category-uuid-2');

-- 3. 특정 카테고리의 뉴스 조회
SELECT n.* FROM news n
JOIN category_mappings cm ON n.id = cm.entity_id
WHERE cm.category_id = 'category-uuid' AND cm.deleted_at IS NULL;
```

**검증 포인트**:
- ✅ Category 테이블에서 `entityType = 'news'`로 구분
- ✅ CategoryMapping으로 다대다 관계 정규화
- ✅ `(entityId, categoryId)` 복합 유니크 키로 중복 방지
- ✅ 카테고리별 정렬 순서 관리 가능
</details>

<details>
<summary><strong>📊 시나리오 5: 정렬 순서 관리 - 상세 SQL</strong></summary>

```sql
-- 여러 뉴스의 순서를 일괄 변경
UPDATE news SET "order" = 1, updated_at = NOW() WHERE id = 'uuid-1';
UPDATE news SET "order" = 2, updated_at = NOW() WHERE id = 'uuid-2';
UPDATE news SET "order" = 3, updated_at = NOW() WHERE id = 'uuid-3';

-- 또는 트랜잭션으로 일괄 처리
BEGIN;
  UPDATE news SET "order" = 
    CASE id
      WHEN 'uuid-1' THEN 1
      WHEN 'uuid-2' THEN 2
      WHEN 'uuid-3' THEN 3
    END,
    updated_at = NOW()
  WHERE id IN ('uuid-1', 'uuid-2', 'uuid-3');
COMMIT;
```

**검증 포인트**:
- ✅ `order` 필드로 정렬 순서 관리
- ✅ 배치 업데이트로 효율적인 순서 변경
- ✅ 카테고리도 `order` 필드로 정렬 가능
</details>

<details>
<summary><strong>📊 시나리오 6: 외부 링크 관리 - 상세 구조</strong></summary>

```typescript
// url 필드 구조
{
  url: "https://www.news-site.com/article/lumir-global-expansion"
}

// 특징:
// 1. text 타입 (nullable)
// 2. 외부 뉴스 기사 원본 URL
// 3. 클릭 시 외부 페이지로 이동
// 4. 원본 기사 보기 기능

// 사용 시나리오:
// - 언론 보도 기사 링크
// - 외부 언론사 뉴스 원본
// - 상세 페이지 URL
// - 프레스 릴리스 링크
```

**검증 포인트**:
- ✅ url 필드로 외부 링크 관리
- ✅ text 타입 (nullable)으로 선택적 사용
- ✅ 외부 뉴스 원본 연결
- ✅ 클릭 시 외부 페이지 이동
</details>

<details>
<summary><strong>📊 시나리오 7: 첨부파일 관리 - JSONB 구조</strong></summary>

```typescript
// attachments JSONB 구조
{
  attachments: [
    {
      fileName: "press_release.pdf",
      fileUrl: "https://s3.amazonaws.com/lumir-cms/news/press_release.pdf",
      fileSize: 512000,
      mimeType: "application/pdf"
    },
    {
      fileName: "product_image.jpg",
      fileUrl: "https://s3.amazonaws.com/lumir-cms/news/product_image.jpg",
      fileSize: 204800,
      mimeType: "image/jpeg"
    },
    {
      fileName: "infographic.webp",
      fileUrl: "https://s3.amazonaws.com/lumir-cms/news/infographic.webp",
      fileSize: 153600,
      mimeType: "image/webp"
    }
  ]
}
```

**검증 포인트**:
- ✅ attachments JSONB로 파일 메타데이터 저장
- ✅ AWS S3 URL 참조
- ✅ 파일 크기, MIME 타입 저장
- ✅ 4가지 파일 타입 지원 (PDF, JPG, PNG, WEBP)
</details>

---

## 4. 검증 결과 요약

### 4.1 전체 검증 결과 (통합 테이블)

| 시나리오 | 검증 결과 | 관련 엔티티 | 핵심 기능 | 비고 |
|---------|----------|------------|----------|------|
| 뉴스 생성 | ✅ **통과** | News | • 제목/설명 저장<br>• JSONB 첨부파일<br>• S3 업로드<br>• 외부 링크 관리 | 다국어 지원 없음<br>한국어만 사용<br>4가지 파일 타입 지원<br>외부 뉴스 원본 연결 |
| 뉴스 수정 (파일 포함) | ✅ **통과** | News | • 내용 업데이트<br>• attachments 교체<br>• url 수정 | 기존 파일 삭제 → 새 파일 업로드<br>완전 교체 방식 |
| 공개 상태 관리 | ✅ **통과** | News | • isPublic 토글<br>• 즉시 반영<br>• 워크플로우 없음 | ContentStatus 제거됨 |
| 카테고리 관리 | ✅ **통과** | Category<br>CategoryMapping | • 통합 카테고리<br>• 다대다 관계<br>• 중복 방지 (UK) | entityType = 'news' 구분 |
| 정렬 순서 관리 | ✅ **통과** | News | • order 필드<br>• 배치 업데이트<br>• 트랜잭션 처리 | CASE 문으로 효율적 처리 |
| 외부 링크 관리 | ✅ **통과** | News | • url 필드<br>• 외부 뉴스 원본 연결<br>• 클릭 시 외부 이동 | 언론 보도 기사 링크 |
| 첨부파일 관리 | ✅ **통과** | News | • JSONB 구조<br>• S3 URL 참조<br>• 4가지 파일 타입 | 파일 메타데이터 유연 저장<br>PDF/JPG/PNG/WEBP |

### 4.2 ERD 강점 분석 (테이블)

| 패턴/기능 | 구현 방식 | 장점 | 적용 엔티티 | 성능/확장성 |
|----------|----------|------|------------|------------|
| **단일 엔티티 설계<br>(No Translation)** | 다국어 지원 없음<br>한국어만 사용 | • 구조 단순화<br>• 쿼리 성능 향상<br>• 관리 부담 감소 | News | ⭐⭐⭐⭐⭐<br>Translation 조인 불필요 |
| **외부 링크 관리** | url 필드<br>(text nullable) | • 외부 뉴스 원본 연결<br>• 클릭 시 외부 페이지<br>• 언론 보도 통합 | News.url | ⭐⭐⭐⭐⭐<br>간단한 링크 관리 |
| **통합 카테고리 관리** | 단일 Category 테이블 +<br>entityType 구분 | • 일관된 구조<br>• 관리 효율성 향상<br>• 쿼리 최적화 | Category<br>(entityType = 'news') | ⭐⭐⭐⭐⭐<br>모든 도메인 공유 |
| **JSONB 활용<br>(Flexible Data)** | attachments를<br>JSONB로 저장 | • 유연한 메타데이터 저장<br>• 파일 수 제한 없음<br>• PostgreSQL 최적화<br>• 다양한 파일 타입 | News.attachments | ⭐⭐⭐⭐<br>파일 수에 무관<br>4가지 타입 지원 |
| **Soft Delete** | deletedAt 필드로<br>논리 삭제 | • 데이터 복구 가능<br>• 감사 로그 유지<br>• 참조 무결성 보존 | News<br>(BaseEntity) | ⭐⭐⭐⭐<br>안전한 삭제 |
| **Optimistic Locking** | version 필드로<br>동시성 제어 | • 충돌 방지<br>• 일관성 보장<br>• Lock 없이 처리 | News<br>(BaseEntity) | ⭐⭐⭐⭐⭐<br>성능 저하 없음 |
| **인덱스 최적화** | isPublic, order<br>인덱스 | • 빠른 필터링<br>• 정렬 성능 향상<br>• 쿼리 최적화 | News | ⭐⭐⭐⭐⭐<br>대용량 데이터 대응 |

### 4.3 개선 제안 사항 (우선순위별)

| 우선순위 | 항목 | 현재 상태 | 제안 내용 | 필요성 | 구현 복잡도 |
|---------|------|----------|----------|-------|-----------|
| 🟢 **낮음** | 첨부파일<br>버전 관리 | attachments JSONB에<br>메타데이터만 저장 | • FileHistory 테이블 추가<br>• 업로드 이력 추적<br>• 감사 로그 기능 | 파일 변경 이력<br>감사가 필요하다면 | ⭐⭐⭐ 중간<br>(테이블 추가) |
| 🟢 **낮음** | 카테고리<br>계층 구조 | Category는<br>평면(flat) 구조 | • parentId 필드 추가<br>• depth 필드 추가<br>• 계층 쿼리 지원 | 계층적 카테고리<br>필요 시에만 | ⭐⭐⭐⭐ 높음<br>(Closure Table) |
| 🟢 **낮음** | 다국어 지원 추가 | 현재 한국어만 지원 | • NewsTranslation 테이블 추가<br>• Language 관계 설정<br>• Fallback 로직 구현 | 글로벌 전개 시에만<br>필요 | ⭐⭐⭐ 중간<br>(Translation 패턴) |
| 🟢 **낮음** | 뉴스 조회수<br>추적 | 현재 기능 없음 | • viewCount 필드 추가<br>• 조회수 카운터 증가<br>• 인기 뉴스 정렬 | 뉴스 인기도<br>분석이 필요하다면 | ⭐⭐ 낮음<br>(필드 추가) |

**판단 기준**:
- 🔴 **높음**: 코드 품질 및 유지보수에 직접 영향
- 🟡 **중간**: 감사 로그 및 이력 관리 요구사항에 따라 결정
- 🟢 **낮음**: 비즈니스 요구사항 변경 시에만 필요

---

## 5. 결론

### ✅ 최종 검증 결과

뉴스 시나리오에 맞게 ERD가 **완벽하게 설계**되어 있습니다.

**강점**:
1. ✅ **단순한 구조**: 다국어 지원 없이 한국어만 사용, Translation 조인 불필요로 성능 향상
2. ✅ **외부 링크 관리**: url 필드로 외부 뉴스 기사 원본 연결, 언론 보도 통합 관리
3. ✅ **유연한 파일 관리**: JSONB attachments로 다양한 파일 관리, 4가지 파일 타입 지원
4. ✅ **통합 카테고리**: 단일 테이블로 모든 도메인 카테고리 관리
5. ✅ **간단한 상태 관리**: isPublic만으로 즉시 공개/비공개 제어
6. ✅ **데이터 무결성**: UK 제약조건, Soft Delete, Optimistic Locking
7. ✅ **인덱스 최적화**: isPublic, order 인덱스로 빠른 조회

**핵심 설계 특징**:
- 🎯 **단일 엔티티**: Translation 테이블 없이 News만으로 모든 데이터 관리
- 🔗 **외부 링크 통합**: url 필드로 외부 뉴스 기사 원본 연결
- 📁 **4가지 파일 타입**: PDF, JPG, PNG, WEBP 지원
- 💾 **JSONB 메타데이터**: 파일명, URL, 크기, MIME 타입 유연하게 저장
- 🔄 **완전 교체 방식**: 수정 시 기존 파일 삭제 후 새 파일 업로드
- ☁️ **AWS S3 연동**: 파일은 S3에 저장, DB에는 메타데이터만 저장

**파일 관리 특징**:
- 📁 **4가지 파일 타입**: PDF, JPG, PNG, WEBP 지원
- 💾 **JSONB 메타데이터**: 파일명, URL, 크기, MIME 타입 유연하게 저장
- 🔄 **완전 교체 방식**: 수정 시 기존 파일 삭제 후 새 파일 업로드
- ☁️ **AWS S3 연동**: 파일은 S3에 저장, DB에는 메타데이터만 저장

**외부 링크 특징**:
- 🔗 **url 필드**: text nullable로 선택적 사용
- 📰 **언론 보도 연결**: 외부 뉴스 기사 원본 링크
- 🌐 **외부 페이지 이동**: 클릭 시 외부 사이트로 이동
- 📝 **원본 기사 보기**: 언론사 뉴스 원문 제공

**개선 제안**:
1. 💡 파일 이력 추적이 필요하다면 FileHistory 테이블 고려
2. 💡 카테고리 계층 구조가 필요하다면 `parentId` 필드 추가 고려
3. 💡 글로벌 전개 시 다국어 지원이 필요하다면 NewsTranslation 테이블 추가 고려
4. 💡 뉴스 인기도 분석이 필요하다면 viewCount 필드 추가 고려

---

**문서 종료**
