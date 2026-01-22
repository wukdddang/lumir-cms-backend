# 백업 시스템 빠른 시작 가이드

백업 시스템을 5분 안에 설정하고 실행하는 방법입니다.

## ⚡ 빠른 시작 (5분)

### 1단계: 환경변수 설정 (1분)

`.env` 파일에 다음 내용을 추가하세요:

```bash
# 백업 활성화
BACKUP_ENABLED=true

# 백업 저장 경로 (기본값 사용 권장)
BACKUP_PATH=./backups/database

# 압축 활성화 (기본값: true, 70-90% 용량 절감)
BACKUP_COMPRESS=true

# 재시도 설정 (선택사항, 기본값 사용 가능)
BACKUP_MAX_RETRIES=3
BACKUP_RETRY_DELAY_MS=5000
```

### 2단계: 백업 시스템 확인 (1분)

백업 시스템은 TypeORM을 사용하므로 **추가 설치가 필요 없습니다**!

**장점**:
- ✅ pg_dump 설치 불필요
- ✅ PostgreSQL 클라이언트 설치 불필요  
- ✅ Node.js만 있으면 바로 실행 가능
- ✅ gzip 압축으로 70-90% 용량 절감

### 3단계: 테스트 백업 실행 (1분)

첫 백업을 실행해보세요:

```bash
npm run backup daily
```

**성공 메시지:**
```
🚀 백업 스크립트 시작
📦 daily 백업을 실행합니다...
✅ daily 백업 성공
   파일명: backup_daily_20260121_153045.sql.gz
   경로: ./backups/database/daily/backup_daily_20260121_153045.sql.gz
   크기: 256 KB (압축 전: 2.5 MB, 압축률: 89.8%)
✅ 백업 스크립트 완료
```

### 4단계: 백업 확인 (1분)

생성된 백업을 확인:

```bash
npm run backup:list
```

### 5단계: 애플리케이션 실행 (1분)

이제 애플리케이션을 실행하면 자동 백업이 시작됩니다:

```bash
npm run start:dev
```

**로그에서 확인:**
```
[BackupScheduler] 백업 스케줄러가 초기화되었습니다.
```

## ✅ 완료!

이제 백업 시스템이 자동으로 실행됩니다:

- **4시간마다**: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
- **매일**: 새벽 1시
- **매주**: 일요일 새벽 1시 30분
- **매월**: 1일 새벽 2시
- **분기**: 1/1, 4/1, 7/1, 10/1 새벽 3시
- **연간**: 1월 1일 새벽 4시

## 📋 자주 사용하는 명령어

```bash
# 즉시 백업 실행
npm run backup

# 특정 타입만 백업
npm run backup daily

# 백업 목록 조회
npm run backup:list

# 백업 통계 조회
npm run backup:list -- --stats

# 만료된 백업 정리
npm run backup:cleanup
```

## 🔍 백업 확인

백업 파일 위치:

```
./backups/database/
├── four_hourly/
├── daily/
├── weekly/
├── monthly/
├── quarterly/
└── yearly/
```

## 🆘 문제 발생 시

### "백업이 비활성화되어 있습니다"
→ `.env`에서 `BACKUP_ENABLED=true` 설정

### "데이터베이스 연결 실패"
→ 데이터베이스가 실행 중인지 확인

### "permission denied"
→ 백업 디렉토리 권한 확인 (`chmod 755 ./backups`)

### "connection refused"
→ 데이터베이스가 실행 중인지 확인

## 📚 상세 가이드

더 자세한 내용은 다음 문서를 참조하세요:

- **[데이터베이스 백업 가이드](./database-backup-guide.md)** - 전체 가이드
- **[TypeORM 백업의 장점](./typeorm-backup-benefits.md)** ⭐ - pg_dump 대비 장점
- **[SQL 복구 가이드](./sql-restore-guide.md)** - 복구 방법 상세
- **[스크립트 사용 가이드](../../scripts/backup/README.md)** - 스크립트 상세

---

**마지막 업데이트**: 2026-01-21  
**소요 시간**: 5분  
**난이도**: ⭐ (쉬움)
