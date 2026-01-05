# Docker 배포 가이드

## 개요

이 프로젝트는 Docker와 Docker Compose를 사용하여 컨테이너화되어 있습니다.
Docker 이미지 버전은 `package.json`의 버전(현재: 0.0.1)을 자동으로 따릅니다.

## 사전 요구사항

- Docker 20.10 이상
- Docker Compose 2.0 이상
- Docker Hub 계정 (이미지 푸시 시)

## 빠른 시작

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Docker Hub 설정
DOCKER_USERNAME=your-dockerhub-username

# 애플리케이션 버전
VERSION=0.0.1

# Node 환경
NODE_ENV=production
PORT=4000

# 데이터베이스 설정 (개별 환경 변수 사용 - 권장)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=lumir_admin
DATABASE_PASSWORD=lumir_password_2024
DATABASE_NAME=lumir_cms_management
# 또는 DATABASE_URL 사용 (하위 호환성)
# DATABASE_URL=postgresql://lumir_admin:lumir_password_2024@postgres:5432/lumir_cms_management

# SSO 설정 (필수)
SSO_BASE_URL=https://lsso.vercel.app
SSO_CLIENT_ID=your-sso-client-id
SSO_CLIENT_SECRET=your-sso-client-secret
SSO_SYSTEM_NAME=CMS-PROD

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

### 2. Docker Compose로 실행

**.env 파일을 생성했다면 간단하게 실행:**

```bash
docker compose up -d
```

**환경 변수로 직접 지정하여 실행:**

```bash
# Linux/macOS (Bash)
export DOCKER_USERNAME=your-dockerhub-username
export SSO_CLIENT_ID=your-client-id
export SSO_CLIENT_SECRET=your-client-secret
docker compose up -d

# Windows (PowerShell)
$env:DOCKER_USERNAME = "your-dockerhub-username"
$env:SSO_CLIENT_ID = "your-client-id"
$env:SSO_CLIENT_SECRET = "your-client-secret"
docker compose up -d
```

**참고:** `.env` 파일이 있으면 자동으로 환경 변수를 로드합니다.

### 3. 로그 확인

```bash
docker compose logs -f
```

### 4. 서비스 중지

```bash
docker compose down
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
- 포트: 5433:5432
- 데이터베이스: lumir_cms_management
- 사용자: lumir_admin
- 비밀번호: lumir_password_2024

### app

- NestJS 애플리케이션
- 포트: 3000:3000
- PostgreSQL에 의존
- Health check 포함

## 환경 변수

### 필수 환경 변수

- `DOCKER_USERNAME`: Docker Hub 사용자명
- `VERSION`: 애플리케이션 버전 (기본값: 0.0.1)

### 애플리케이션 환경 변수

- `NODE_ENV`: 실행 환경 (production/development)

**데이터베이스 연결 (개별 환경 변수 사용 - 권장):**
- `DATABASE_HOST`: 데이터베이스 호스트 (예: localhost, postgres)
- `DATABASE_PORT`: 데이터베이스 포트 (기본값: 5432)
- `DATABASE_USERNAME`: 데이터베이스 사용자명
- `DATABASE_PASSWORD`: 데이터베이스 비밀번호
- `DATABASE_NAME`: 데이터베이스 이름
- `DATABASE_SSL`: SSL 사용 여부 (true/false, 기본값: false)

**또는 DATABASE_URL 사용 (하위 호환성):**
- `DATABASE_URL`: PostgreSQL 연결 URL (예: postgresql://user:password@host:port/database)

**참고:** `DATABASE_URL`과 개별 환경 변수를 동시에 설정하면 `DATABASE_URL`이 우선됩니다.

## 트러블슈팅

### 포트 충돌

기본 포트가 이미 사용 중인 경우, `docker-compose.yml`에서 포트를 변경:

```yaml
ports:
  - '3001:3000' # 3000 대신 3001 포트 사용
```

### 데이터베이스 연결 실패

1. PostgreSQL 컨테이너가 실행 중인지 확인:

   ```bash
   docker ps | grep postgres
   ```

2. PostgreSQL 로그 확인:

   ```bash
   docker-compose logs postgres
   ```

3. 데이터베이스 헬스체크 확인:
   ```bash
   docker inspect lumir-evaluation-postgres
   ```

### 이미지 빌드 실패

1. Docker 데몬이 실행 중인지 확인
2. 디스크 공간 확인
3. Docker 캐시 정리:
   ```bash
   docker system prune -a
   ```

## 버전 업데이트

1. `package.json`의 `version` 필드 업데이트
2. Docker 이미지 재빌드 및 푸시
3. Docker Compose 재시작

```bash
# package.json 버전 업데이트 후
npm run docker:build-and-push

# 새 버전으로 재시작
export VERSION=0.0.2
docker compose up -d
```

## 보안 고려사항

- **프로덕션 환경**에서는 `.env` 파일의 비밀번호를 반드시 변경하세요
- Docker Hub private repository 사용을 권장합니다
- 민감한 정보는 Docker secrets 또는 환경 변수로 관리하세요

## 추가 정보

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [NestJS 공식 문서](https://docs.nestjs.com/)
