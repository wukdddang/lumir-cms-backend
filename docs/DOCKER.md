# Docker 배포 가이드

## 개요

이 프로젝트는 PostgreSQL 데이터베이스만 Docker로 실행하고, 백엔드 애플리케이션은 로컬에서 실행하는 구조입니다.

## 사전 요구사항

- Docker 20.10 이상
- Docker Compose 2.0 이상
- Node.js 20 이상
- npm 또는 yarn

## 빠른 시작

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Node 환경
NODE_ENV=development
PORT=4000

# 데이터베이스 설정 (로컬 Docker PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_USERNAME=lumir_admin
DATABASE_PASSWORD=lumir_password_2024
DATABASE_NAME=lumir_cms_management
DB_SYNCHRONIZE=true
DB_LOGGING=true

# SSO 설정 (필수)
SSO_BASE_URL=https://lsso.vercel.app
SSO_CLIENT_ID=your-sso-client-id
SSO_CLIENT_SECRET=your-sso-client-secret
SSO_SYSTEM_NAME=CMS-DEV

# SSO 추가 설정 (선택사항)
SSO_TIMEOUT_MS=10000
SSO_RETRIES=3
SSO_RETRY_DELAY=200
SSO_ENABLE_LOGGING=false

# 직원 동기화 설정
EXTERNAL_METADATA_API_URL=https://lumir-metadata-manager.vercel.app
EMPLOYEE_SYNC_ENABLED=true
```

**필수 환경 변수:**

- `SSO_CLIENT_ID`: SSO 클라이언트 ID
- `SSO_CLIENT_SECRET`: SSO 클라이언트 시크릿

### 2. PostgreSQL 시작 (Docker Compose)

```bash
# PostgreSQL 컨테이너 시작
docker compose up -d

# 로그 확인
docker compose logs -f

# 컨테이너 상태 확인
docker compose ps
```

### 3. 백엔드 애플리케이션 실행 (로컬)

```bash
# 의존성 설치
npm install

# 개발 모드로 실행
npm run start:dev

# 또는 프로덕션 빌드 후 실행
npm run build
npm run start:prod
```

### 4. 서비스 중지

```bash
# PostgreSQL 컨테이너 중지
docker compose down

# 데이터 볼륨까지 삭제
docker compose down -v
```

## Docker 이미지 빌드 및 푸시

### 방법 1: 스크립트 사용 (권장)

#### Linux/macOS

```bash
# 실행 권한 부여
chmod +x docker-build-push.sh

# Docker Hub 사용자명 설정
export DOCKER_USERNAME=your-dockerhub-username

# 빌드 및 푸시
./docker-build-push.sh
```

#### Windows (PowerShell)

```powershell
# Docker Hub 사용자명 설정
$env:DOCKER_USERNAME = "your-dockerhub-username"

# 빌드 및 푸시
.\docker-build-push.ps1
```

### 방법 2: npm 스크립트 사용

```bash
# Linux/macOS
export DOCKER_USERNAME=your-dockerhub-username
npm run docker:build-and-push

# Windows (PowerShell)
$env:DOCKER_USERNAME = "your-dockerhub-username"
npm run docker:build-and-push
```

### 방법 3: 수동 빌드 및 푸시

```bash
# 1. 이미지 빌드
docker build -t lumir-cms-management-system:0.0.1 .
docker build -t lumir-cms-management-system:latest .

# 2. Docker Hub 태그 추가
docker tag lumir-cms-management-system:0.0.1 your-dockerhub-username/lumir-cms-management-system:0.0.1
docker tag lumir-cms-management-system:latest your-dockerhub-username/lumir-cms-management-system:latest

# 3. Docker Hub에 푸시
docker login
docker push your-dockerhub-username/lumir-cms-management-system:0.0.1
docker push your-dockerhub-username/lumir-cms-management-system:latest
```

## npm 스크립트

package.json에 다음 Docker 관련 스크립트가 추가되어 있습니다:

- `npm run docker:build` - Docker 이미지 빌드
- `npm run docker:push` - Docker Hub에 이미지 푸시
- `npm run docker:build-and-push` - 빌드 후 푸시
- `npm run docker:compose:up` - Docker Compose 시작
- `npm run docker:compose:down` - Docker Compose 종료
- `npm run docker:compose:logs` - Docker Compose 로그 확인

## Docker Compose 서비스 구성

### postgres

- PostgreSQL 15 (Alpine)
- 포트: 5434:5432 (호스트:컨테이너)
- 데이터베이스: lumir_cms_management
- 사용자: lumir_admin
- 비밀번호: lumir_password_2024
- Health check 포함

## 로컬 개발 환경

### 데이터베이스 연결

백엔드 애플리케이션은 `libs/database/database.module.ts`를 통해 데이터베이스에 연결합니다.

**주요 기능:**

- TypeORM을 사용한 PostgreSQL 연결 관리
- 환경 변수 기반 설정
- 자동 엔티티 로딩
- 트랜잭션 관리 (TransactionManagerService)
- Repository 패턴 인터페이스 제공

### 필수 파일

```
libs/database/
├── base/                           # 기본 엔티티/DTO
│   ├── base.entity.ts
│   ├── base.dto.ts
│   └── index.ts
├── interfaces/                     # Repository 인터페이스
│   └── repository.interface.ts
├── database.module.ts              # 데이터베이스 모듈
├── transaction-manager.service.ts  # 트랜잭션 관리
└── index.ts                        # Export 진입점
```

## 환경 변수

### 필수 환경 변수

- `SSO_CLIENT_ID`: SSO 클라이언트 ID
- `SSO_CLIENT_SECRET`: SSO 클라이언트 시크릿

### 데이터베이스 환경 변수

- `DATABASE_HOST`: 데이터베이스 호스트 (기본값: localhost)
- `DATABASE_PORT`: 데이터베이스 포트 (기본값: 5434)
- `DATABASE_USERNAME`: 데이터베이스 사용자명 (기본값: lumir_admin)
- `DATABASE_PASSWORD`: 데이터베이스 비밀번호 (기본값: lumir_password_2024)
- `DATABASE_NAME`: 데이터베이스 이름 (기본값: lumir_cms_management)
- `DATABASE_SSL`: SSL 사용 여부 (true/false, 기본값: false)
- `DB_SYNCHRONIZE`: TypeORM 자동 동기화 (true/false, 기본값: 개발 환경에서 true)
- `DB_LOGGING`: 쿼리 로깅 활성화 (true/false, 기본값: 개발 환경에서 true)

### 애플리케이션 환경 변수

- `NODE_ENV`: 실행 환경 (development/production/test)
- `PORT`: 애플리케이션 포트 (기본값: 4000)

## 트러블슈팅

### 포트 충돌

기본 포트가 이미 사용 중인 경우, `docker-compose.yml`에서 포트를 변경:

```yaml
ports:
  - '5435:5432' # 5434 대신 5435 포트 사용
```

`.env` 파일도 함께 수정:

```env
DATABASE_PORT=5435
```

### 데이터베이스 연결 실패

1. PostgreSQL 컨테이너가 실행 중인지 확인:

   ```bash
   docker ps | grep postgres
   ```

2. PostgreSQL 로그 확인:

   ```bash
   docker compose logs postgres
   ```

3. 데이터베이스 헬스체크 확인:

   ```bash
   docker inspect lumir-cms-postgres
   ```

4. 연결 테스트:

   ```bash
   psql -h localhost -p 5434 -U lumir_admin -d lumir_cms_management
   ```

### 백엔드 연결 오류

1. 환경 변수 확인:

   ```bash
   # .env 파일이 있는지 확인
   cat .env

   # DATABASE_HOST가 localhost인지 확인
   # DATABASE_PORT가 5434인지 확인
   ```

2. TypeORM 연결 로그 확인:

   ```env
   DB_LOGGING=true
   ```

### Docker 캐시 정리

```bash
# 사용하지 않는 Docker 리소스 정리
docker system prune -a

# 특정 볼륨 삭제
docker volume rm lumir-cms-backend_postgres_data
```

## 데이터 관리

### 데이터베이스 백업

```bash
# 데이터베이스 덤프
docker exec lumir-cms-postgres pg_dump -U lumir_admin lumir_cms_management > backup.sql

# 압축하여 백업
docker exec lumir-cms-postgres pg_dump -U lumir_admin lumir_cms_management | gzip > backup.sql.gz
```

### 데이터베이스 복원

```bash
# SQL 파일로 복원
docker exec -i lumir-cms-postgres psql -U lumir_admin -d lumir_cms_management < backup.sql

# 압축 파일로 복원
gunzip -c backup.sql.gz | docker exec -i lumir-cms-postgres psql -U lumir_admin -d lumir_cms_management
```

### 데이터 초기화

```bash
# 컨테이너와 볼륨 모두 삭제
docker compose down -v

# 다시 시작
docker compose up -d
```

## 프로덕션 배포

### Docker로 전체 애플리케이션 배포 (선택사항)

프로덕션 환경에서 백엔드도 Docker로 배포하려면 `Dockerfile`을 사용할 수 있습니다:

```bash
# 이미지 빌드
docker build -t lumir-cms-backend:latest .

# 컨테이너 실행
docker run -d \
  --name lumir-cms-app \
  -p 4000:4000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5434 \
  -e SSO_CLIENT_ID=your-client-id \
  -e SSO_CLIENT_SECRET=your-client-secret \
  lumir-cms-backend:latest
```

**참고:** 현재 `docker-compose.yml`에는 백엔드 서비스가 제거되어 있습니다. 필요시 추가할 수 있습니다.

## 보안 고려사항

- **프로덕션 환경**에서는 반드시 환경 변수의 비밀번호를 변경하세요
- `.env` 파일은 `.gitignore`에 포함되어야 합니다
- Docker 볼륨의 백업을 정기적으로 수행하세요
- PostgreSQL 포트(5434)는 필요시 방화벽으로 보호하세요

## 유용한 명령어

```bash
# PostgreSQL 컨테이너 접속
docker exec -it lumir-cms-postgres psql -U lumir_admin -d lumir_cms_management

# 컨테이너 로그 실시간 확인
docker compose logs -f postgres

# 컨테이너 리소스 사용량 확인
docker stats lumir-cms-postgres

# 볼륨 목록 확인
docker volume ls | grep lumir-cms

# 네트워크 확인
docker network inspect lumir-cms-backend_lumir-cms-network
```

## 추가 정보

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeORM 공식 문서](https://typeorm.io/)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)