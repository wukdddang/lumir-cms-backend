# 백업 시스템 가이드

루미르 CMS 백엔드의 데이터베이스 자동 백업 시스템입니다.

---

## 🚀 빠른 시작

### 1. 환경변수 설정

`.env` 파일에 추가:

```bash
BACKUP_ENABLED=true
BACKUP_PATH=./backups/database
BACKUP_COMPRESS=true
```

### 2. 백업 실행

```bash
# 모든 타입 백업
npm run backup

# 특정 타입만
npm run backup daily
```

### 3. 백업 확인

```bash
npm run backup:list
```

---

## 📋 백업 전략 (GFS)

| 타입 | 주기 | 보관 기간 | 실행 시간 |
|------|------|-----------|----------|
| 4시간 | 4시간마다 | 7일 | 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 |
| 일간 | 매일 | 30일 | 01:00 |
| 주간 | 매주 일요일 | 90일 | 01:30 |
| 월간 | 매월 1일 | 1년 | 02:00 |
| 분기 | 분기 첫날 | 2년 | 03:00 |
| 연간 | 1월 1일 | 5년 | 04:00 |

**자동 정리**: 매일 새벽 5시에 만료된 백업 자동 삭제

---

## 🛠️ 주요 명령어

### 백업 실행
```bash
npm run backup              # 모든 타입
npm run backup daily        # 특정 타입만
```

### 백업 조회
```bash
npm run backup:list         # 목록
npm run backup:list -- --stats  # 통계 포함
```

### 백업 관리
```bash
npm run backup:cleanup      # 만료된 백업 삭제
```

---

## 🔄 복구 방법

압축된 SQL 파일을 `gunzip`으로 압축 해제 후 `psql`로 복구:

```bash
# 1. 압축 해제
gunzip -c ./backups/database/daily/backup_daily_20260121_010000.sql.gz > backup.sql

# 2. 복구
PGPASSWORD="$DATABASE_PASSWORD" psql \
  -h "$DATABASE_HOST" \
  -p "$DATABASE_PORT" \
  -U "$DATABASE_USERNAME" \
  -d "$DATABASE_NAME" \
  -f backup.sql

# 또는 한 번에 (Windows에서는 7zip 사용)
gunzip -c backup_daily_20260121_010000.sql.gz | psql -h localhost -U postgres -d lumir_cms
```

---

## 📚 상세 문서

| 문서 | 설명 |
|------|------|
| **[빠른 시작](./quick-start.md)** | 5분 안에 백업 시작하기 |
| **[전체 가이드](./database-backup-guide.md)** | 상세 설정 및 사용법 |
| **[복구 가이드](./sql-restore-guide.md)** | 백업 복구 방법 |
| **[압축 가이드](./compression-guide.md)** | 백업 압축 설정 및 관리 |
| **[TypeORM 백업](./typeorm-backup-benefits.md)** | pg_dump 대신 TypeORM 사용 이유 |

---

## ✨ 특징

- ✅ **설치 불필요**: pg_dump 없이 TypeORM으로 백업
- ✅ **자동 실행**: 스케줄러가 자동으로 백업
- ✅ **고효율 압축**: gzip으로 70-90% 용량 절감
- ✅ **SQL 파일**: 텍스트로 확인 가능, 편집 가능
- ✅ **크로스 플랫폼**: Windows, Linux, Mac 모두 지원
- ✅ **타입 안전**: TypeScript로 구현

---

## 🆘 문제 해결

### 백업이 실행되지 않음
→ `.env`에서 `BACKUP_ENABLED=true` 확인

### 디스크 공간 부족
→ `npm run backup:cleanup` 실행

### 데이터베이스 연결 실패
→ 데이터베이스가 실행 중인지 확인

---

**마지막 업데이트**: 2026-01-21  
**버전**: 2.0.0
