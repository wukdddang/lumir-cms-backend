# 🚨 긴급 수정: categoryId null 에러 해결

## 빠른 해결 방법

### Dev 서버에서 실행

```bash
# 1. 코드 업데이트
git pull origin dev

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. 마이그레이션 실행 (자동으로 null 값을 기본 카테고리로 설정)
npm run migration:run

# 5. 서비스 재시작
pm2 restart all
```

끝! 서버가 정상적으로 시작됩니다. ✅

---

## 무엇이 변경되었나요?

### 문제
- 데이터베이스에 `categoryId`가 null인 레코드가 있어서 서버 시작 실패
- 에러: `column "categoryId" of relation "brochures" contains null values`

### 해결
- **마이그레이션**이 자동으로:
  1. 각 모듈별로 "미분류" 카테고리를 생성합니다
  2. null인 categoryId를 "미분류" 카테고리로 자동 업데이트합니다
  3. 데이터 무결성을 유지합니다 (NOT NULL 제약조건)

### 영향받는 모듈
- ✅ 브로슈어 (brochures)
- ✅ IR 자료 (irs)
- ✅ 전자공시 (electronic_disclosures)
- ✅ 주주총회 (shareholders_meetings)
- ✅ 공지사항 (announcements)
- ✅ 루미르 스토리 (lumir_stories)
- ✅ 비디오 갤러리 (video_galleries)
- ✅ 뉴스 (news)
- ✅ 메인 팝업 (main_popups)

---

## 확인 방법

### 1. 서버 상태 확인
```bash
pm2 status
pm2 logs --lines 50
```

### 2. 데이터베이스 확인
```sql
-- null categoryId가 없어야 함 (0이어야 함)
SELECT COUNT(*) FROM brochures WHERE "categoryId" IS NULL;

-- 미분류 카테고리 확인
SELECT * FROM categories WHERE name = '미분류';
```

### 3. API 테스트
각 모듈의 목록 조회 API를 테스트하여 정상 작동 확인

---

## 문제 발생 시

### 롤백
```bash
npm run migration:revert
git checkout <previous-commit>
npm run build
pm2 restart all
```

### 로그 확인
```bash
pm2 logs --lines 100
```

---

## 주요 변경사항

### 1. Database Module (`libs/database/database.module.ts`)
```typescript
// BEFORE
synchronize: true,  // 위험! 자동으로 스키마 변경

// AFTER
synchronize: false, // 안전! 마이그레이션으로 관리
```

### 2. Entity Files (9개 파일)
```typescript
// BEFORE
categoryId: string | null;  // nullable

// AFTER
categoryId: string;  // NOT NULL (타입 안정성)
```

### 3. Migration File (새로 생성)
- `src/migrations/1737619200000-SetDefaultCategoryForNullValues.ts`
- 기본 카테고리 자동 생성 및 null 값 업데이트

---

## 추가 조치 (선택사항)

### 관리자 페이지에서
1. "미분류" 카테고리로 분류된 항목 확인
2. 필요시 적절한 카테고리로 재분류
3. 불필요한 "미분류" 카테고리는 숨김 또는 삭제 가능

---

## 📚 상세 문서

- [배포 가이드](./DEPLOYMENT.md)
- [마이그레이션 가이드](./docs/migration-guide.md)
- [프로젝트 README](./README.md)

---

## ❓ 자주 묻는 질문

### Q: 기존 데이터는 안전한가요?
**A**: 네! 마이그레이션은 트랜잭션 내에서 실행되며, null 값을 "미분류" 카테고리로 안전하게 업데이트합니다.

### Q: "미분류" 카테고리를 삭제해도 되나요?
**A**: 아니요. 해당 카테고리를 사용하는 항목이 있다면 먼저 다른 카테고리로 재분류해야 합니다.

### Q: 새로운 데이터를 생성할 때 categoryId는 필수인가요?
**A**: 네, 이제 categoryId는 필수 필드입니다. 적절한 카테고리를 선택해야 합니다.

### Q: 프로덕션 배포 시 주의사항은?
**A**: 반드시 데이터베이스 백업 후 배포하세요: `npm run backup`

---

**작성일**: 2026-01-23  
**버전**: v1.0.0  
**작성자**: Development Team
