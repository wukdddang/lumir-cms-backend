# SSOResource API 가이드

  

Single Sign-On 관련 인증 및 사용자 관리 API 리소스 클래스입니다. 시스템 인증, 로그인, 토큰 관리, 비밀번호 관리 등의 기능을 제공합니다.

  

## 목차

  

- [authenticateSystem](#authenticatesystem)

- [login](#login)

- [refreshToken](#refreshtoken)

- [verifyToken](#verifytoken)

- [changePassword](#changepassword)

- [checkPassword](#checkpassword)

  

---

  

## authenticateSystem

  

**기능**: 시스템 인증을 수행합니다. SDK 초기화 시 자동으로 호출되며, 시스템의 `clientId`와 `clientSecret`을 사용하여 인증합니다.

  

**동작 방식**:

  

1. Basic Auth를 사용하여 인증합니다 (clientId:clientSecret을 Base64 인코딩).

2. `POST /api/auth/system` 엔드포인트로 요청을 보냅니다.

3. 인증이 성공하면 `systemId`와 `systemName`을 반환합니다.

4. 이 정보는 SDK 내부에서 저장되어 이후 모든 요청에 `X-System-Name` 헤더로 포함됩니다.

  

**파라미터**: 없음 (생성자에서 주입받은 request 함수가 자동으로 Basic Auth 처리)

  

**반환값**: `Promise<SystemAuthResponse>` - 시스템 인증 응답

  

- `systemId`: 시스템 ID

- `systemName`: 시스템 이름

  

**에러 처리**:

  

- 인증 실패 시 HTTP 401 에러 발생

- 잘못된 `clientId` 또는 `clientSecret` 시 에러 발생

  

**사용 예시**:

  

```typescript

// SDK 초기화 시 자동 호출됨

await client.initialize();

  

// 수동 호출 (일반적으로 필요 없음)

const systemInfo = await client.sso.authenticateSystem();

console.log(`시스템 이름: ${systemInfo.systemName}`);

```

  

---

  

## login

  

**기능**: 이메일과 비밀번호를 사용하여 사용자 로그인을 수행하고 액세스 토큰을 발급받습니다.

  

**동작 방식**:

  

1. `grant_type: "password"`로 OAuth2 password grant 방식의 로그인 요청을 생성합니다.

2. `POST /api/auth/login` 엔드포인트로 요청을 보냅니다.

3. 서버는 이메일과 비밀번호를 검증하고, 유효하면 액세스 토큰과 사용자 정보를 반환합니다.

4. 반환된 토큰은 이후 API 요청의 `Authorization: Bearer {token}` 헤더에 사용됩니다.

  

**파라미터**:

  

- `email` (string, 필수): 사용자 이메일 주소

- `password` (string, 필수): 사용자 비밀번호

  

**반환값**: `Promise<LoginResponse>` - 로그인 응답

  

- `tokenType`: 토큰 타입 (일반적으로 "Bearer")

- `accessToken`: 액세스 토큰

- `expiresAt`: 토큰 만료 시간

- `refreshToken`: 리프레시 토큰 (선택사항)

- `refreshTokenExpiresAt`: 리프레시 토큰 만료 시간 (선택사항)

- `id`: 사용자 ID

- `name`: 사용자 이름

- `email`: 이메일

- `employeeNumber`: 사번

- `phoneNumber`: 전화번호

- `dateOfBirth`: 생년월일

- `gender`: 성별

- `hireDate`: 입사일

- `status`: 상태

- `department`: 부서 정보

- `position`: 직책 정보

- `rank`: 직급 정보

- `systemRoles`: 시스템별 역할 정보

  

**에러 처리**:

  

- 잘못된 이메일 또는 비밀번호 시 HTTP 401 에러 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 로그인

const loginResult = await client.sso.login("user@example.com", "password123");

  

// 토큰 저장

localStorage.setItem("accessToken", loginResult.accessToken);

localStorage.setItem("refreshToken", loginResult.refreshToken);

  

// 사용자 정보 출력

console.log(`환영합니다, ${loginResult.name}님!`);

console.log(`부서: ${loginResult.department}`);

```

  

---

  

## refreshToken

  

**기능**: 만료된 액세스 토큰을 리프레시 토큰을 사용하여 갱신합니다.

  

**동작 방식**:

  

1. `grant_type: "refresh_token"`으로 OAuth2 refresh token grant 방식의 토큰 갱신 요청을 생성합니다.

2. `POST /api/auth/login` 엔드포인트로 요청을 보냅니다 (로그인과 동일한 엔드포인트).

3. 서버는 리프레시 토큰의 유효성을 검증하고, 유효하면 새로운 액세스 토큰을 발급합니다.

4. 새로운 액세스 토큰과 함께 사용자 정보도 함께 반환됩니다.

  

**파라미터**:

  

- `refreshToken` (string, 필수): 리프레시 토큰

  

**반환값**: `Promise<LoginResponse>` - 토큰 갱신 응답 (login과 동일한 구조)

  

**에러 처리**:

  

- 만료되었거나 유효하지 않은 리프레시 토큰 시 HTTP 401 에러 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 토큰 갱신

try {

  const refreshToken = localStorage.getItem("refreshToken");

  const newToken = await client.sso.refreshToken(refreshToken);

  

  // 새 토큰 저장

  localStorage.setItem("accessToken", newToken.accessToken);

  localStorage.setItem("refreshToken", newToken.refreshToken);

} catch (error) {

  // 토큰 갱신 실패 시 재로그인 필요

  console.error("토큰 갱신 실패:", error);

  // 재로그인 플로우 진행

}

```

  

---

  

## verifyToken

  

**기능**: 액세스 토큰의 유효성을 검증합니다. 토큰이 아직 유효한지, 만료되었는지 확인할 수 있습니다.

  

**동작 방식**:

  

1. 전달받은 토큰을 `Authorization: Bearer {token}` 헤더에 포함하여 요청을 보냅니다.

2. `POST /api/auth/verify` 엔드포인트로 요청을 보냅니다.

3. 서버는 토큰의 서명, 만료 시간, 유효성 등을 검증합니다.

4. 검증 결과와 함께 사용자 정보 및 남은 유효 시간을 반환합니다.

  

**파라미터**:

  

- `token` (string, 필수): 검증할 액세스 토큰

  

**반환값**: `Promise<ValidateTokenResponse>` - 토큰 검증 응답

  

- `valid`: 토큰 유효 여부 (boolean)

- `user_info`: 사용자 정보 (토큰이 유효할 때만)

  - `id`: 사용자 ID

  - `name`: 이름

  - `email`: 이메일

  - `employee_number`: 사번

- `expires_in`: 토큰 남은 유효 시간 (초 단위, 토큰이 유효할 때만)

  

**에러 처리**:

  

- 토큰 형식이 잘못되었거나 서명이 유효하지 않으면 HTTP 401 에러 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 토큰 검증

const token = localStorage.getItem("accessToken");

const verifyResult = await client.sso.verifyToken(token);

  

if (verifyResult.valid) {

  console.log("토큰이 유효합니다.");

  console.log(`사용자: ${verifyResult.user_info.name}`);

  console.log(`남은 시간: ${verifyResult.expires_in}초`);

} else {

  console.log("토큰이 만료되었거나 유효하지 않습니다.");

  // 토큰 갱신 또는 재로그인 필요

}

```

  

---

  

## changePassword

  

**기능**: 현재 로그인한 사용자의 비밀번호를 변경합니다.

  

**동작 방식**:

  

1. 전달받은 토큰을 `Authorization: Bearer {token}` 헤더에 포함하여 요청을 보냅니다.

2. 새 비밀번호를 `POST /api/auth/change-password` 엔드포인트로 전송합니다.

3. 서버는 토큰에서 사용자 정보를 추출하고, 해당 사용자의 비밀번호를 변경합니다.

4. 비밀번호 변경 성공 메시지를 반환합니다.

  

**파라미터**:

  

- `token` (string, 필수): 현재 사용자의 액세스 토큰

- `newPassword` (string, 필수): 새로운 비밀번호

  

**반환값**: `Promise<ChangePasswordResponse>` - 비밀번호 변경 응답

  

- `message`: 성공 메시지

  

**에러 처리**:

  

- 유효하지 않은 토큰 시 HTTP 401 에러 발생

- 비밀번호 정책 위반 시 HTTP 400 에러 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 비밀번호 변경

const token = localStorage.getItem("accessToken");

const result = await client.sso.changePassword(token, "newSecurePassword123!");

  

console.log(result.message); // "비밀번호가 성공적으로 변경되었습니다."

```

  

---

  

## checkPassword

  

**기능**: 현재 비밀번호가 올바른지 확인합니다. 비밀번호 변경 전 현재 비밀번호 확인 용도로 사용됩니다.

  

**동작 방식**:

  

1. 전달받은 토큰을 `Authorization: Bearer {token}` 헤더에 포함하여 요청을 보냅니다.

2. 현재 비밀번호를 `POST /api/auth/check-password` 엔드포인트로 전송합니다.

3. 서버는 토큰에서 사용자 정보를 추출하고, 제공된 비밀번호가 해당 사용자의 현재 비밀번호와 일치하는지 확인합니다.

4. 일치 여부를 boolean으로 반환합니다.

  

**파라미터**:

  

- `token` (string, 필수): 현재 사용자의 액세스 토큰

- `currentPassword` (string, 필수): 확인할 현재 비밀번호

- `email` (string, 선택): 확인할 이메일 (선택사항, 토큰과 함께 제공되면 추가 검증)

  

**반환값**: `Promise<CheckPasswordResponse>` - 비밀번호 확인 응답

  

- `isValid`: 비밀번호 일치 여부 (boolean)

  

**에러 처리**:

  

- 유효하지 않은 토큰 시 HTTP 401 에러 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 비밀번호 변경 전 현재 비밀번호 확인

const token = localStorage.getItem("accessToken");

const checkResult = await client.sso.checkPassword(token, "currentPassword123");

  

if (checkResult.isValid) {

  // 현재 비밀번호가 맞음, 새 비밀번호로 변경 진행

  await client.sso.changePassword(token, "newPassword123");

} else {

  console.error("현재 비밀번호가 일치하지 않습니다.");

}

```

  

---

  

**문서 버전**: 1.0  

**최종 업데이트**: 2024년  

**SDK 버전**: 0.1.3