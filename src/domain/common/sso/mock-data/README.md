# SSO Mock 데이터

이 폴더는 실제 SSO 서비스에서 연동한 응답 데이터를 JSON 파일로 저장하는 곳입니다.

## 목적

- 테스트 환경에서 외부 SSO API 호출 없이 테스트 실행
- 일관된 테스트 데이터 제공
- 네트워크 의존성 제거

## Mock 데이터 생성 방법

### 1. 환경 변수 설정

`.env` 파일 또는 환경 변수에 SSO 설정을 추가합니다:

```bash
SSO_BASE_URL=https://lsso.vercel.app
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret
SSO_SYSTEM_NAME=EMS-PROD
```

### 2. Mock 데이터 수집 스크립트 실행

```bash
npm run sso:fetch-mock-data
```

이 스크립트는 다음 데이터를 수집합니다:
- 부서 계층구조
- 모든 부서 정보
- 모든 직원 정보 (부서 계층구조 방식)
- 여러 직원 원시 정보 (동기화용)
- 직원 관리자 정보

### 3. 특정 직원 정보 수집 (선택)

특정 직원의 정보를 수집하려면:

```bash
TEST_EMPLOYEE_NUMBER=E2023001 npm run sso:fetch-mock-data
```

## 생성되는 파일

스크립트 실행 후 다음 위치에 JSON 파일이 생성됩니다:

```
src/domain/common/sso/mock-data/
├── 부서계층구조를조회한다_*.json
├── 모든부서정보를조회한다_*.json
├── 모든직원정보를조회한다_*.json
├── 여러직원원시정보를조회한다_*.json
└── 직원관리자정보를조회한다_*.json
```

## Mock 서비스 사용

테스트 환경에서 Mock 서비스를 사용하려면:

```bash
SSO_USE_MOCK=true npm test
# 또는
NODE_ENV=test npm test
```

Mock 서비스는 이 폴더의 JSON 파일을 읽어서 응답을 반환합니다.

## 주의사항

1. **서버리스 환경**: 실제 서버리스 환경(Vercel, AWS Lambda 등)에서는 파일 저장이 자동으로 비활성화됩니다.
2. **민감 정보**: JSON 파일에는 실제 SSO 응답 데이터가 포함될 수 있으므로 Git에 커밋하지 마세요.
3. **데이터 갱신**: SSO 데이터가 변경되면 주기적으로 스크립트를 실행하여 Mock 데이터를 갱신하세요.

## Git 설정

이 폴더는 `.gitignore`에 추가되어 Git에 커밋되지 않습니다.

```gitignore
src/domain/common/sso/mock-data/
```


