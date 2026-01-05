# FcmResource API 가이드

  

FCM (Firebase Cloud Messaging) 토큰 관리를 위한 API 리소스 클래스입니다. 푸시 알림 전송을 위한 토큰 등록, 조회, 삭제 기능을 제공합니다.

  

## 목차

  

- [subscribe](#subscribe)

- [getToken](#gettoken)

- [unsubscribe](#unsubscribe)

- [getMultipleTokens](#getmultipletokens)

  

---

  

## subscribe

  

**기능**: 사용자의 FCM 토큰을 등록하거나 업데이트합니다. 동일한 `fcmToken`과 `deviceType` 조합이 이미 존재하면 업데이트됩니다.

  

**동작 방식**:

  

1. 필수 파라미터 검증:

   - `employeeId` 또는 `employeeNumber` 중 하나 필수

   - `fcmToken` 필수

   - `deviceType` 필수

2. 검증 실패 시 에러를 발생시킵니다.

3. `POST /api/fcm/subscribe` 엔드포인트로 요청을 보냅니다.

4. 요청 body에 모든 파라미터를 JSON으로 직렬화하여 전송합니다.

5. 서버는 토큰을 등록하거나 업데이트하고, 등록된 토큰을 반환합니다.

  

**파라미터**:

  

- `params.employeeId` (string, 선택): 직원 ID (UUID)

- `params.employeeNumber` (string, 선택): 사번

- `params.fcmToken` (string, 필수): Firebase Cloud Messaging 토큰

- `params.deviceType` (string, 필수): 기기 타입 (예: "android", "ios", "pc", "web")

  

**반환값**: `Promise<SubscribeFcmResponse>` - 구독 결과

  

- `fcmToken`: 등록된 FCM 토큰

  

**에러 처리**:

  

- 필수 파라미터 누락 시 `Error` 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

- `employeeId`와 `employeeNumber`가 모두 제공되면 서버에서 정합성 검증 수행

  

**사용 예시**:

  

```typescript

// 사번으로 토큰 등록

const result = await client.fcm.subscribe({

  employeeNumber: "25001",

  fcmToken: "eGb1fxhAPTM6F-XYvVQFNu:APA91b...",

  deviceType: "android",

});

  

// employeeId로 토큰 등록

const result2 = await client.fcm.subscribe({

  employeeId: "emp-uuid-123",

  fcmToken: "another-token-123",

  deviceType: "ios",

});

```

  

---

  

## getToken

  

**기능**: `employeeId` 또는 `employeeNumber`로 직원의 모든 FCM 토큰을 조회합니다.

  

**동작 방식**:

  

1. 필수 파라미터 검증: `employeeId` 또는 `employeeNumber` 중 하나 필수

2. 검증 실패 시 에러를 발생시킵니다.

3. 전달된 파라미터를 쿼리 스트링으로 변환합니다.

4. `GET /api/fcm/token` 엔드포인트로 요청을 보냅니다.

5. 서버는 해당 직원의 모든 디바이스의 FCM 토큰을 반환합니다.

  

**파라미터**:

  

- `params.employeeId` (string, 선택): 직원 ID (UUID)

- `params.employeeNumber` (string, 선택): 사번

  

**반환값**: `Promise<GetFcmTokenResponse>` - 직원의 모든 FCM 토큰

  

- `employeeId`: 직원 ID

- `employeeNumber`: 사번

- `tokens`: `FcmTokenInfo[]` - FCM 토큰 배열

  - `fcmToken`: FCM 토큰

  - `deviceType`: 기기 타입

  - `createdAt`: 생성일시

  - `updatedAt`: 수정일시

  

**에러 처리**:

  

- 필수 파라미터 누락 시 `Error` 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 사번으로 토큰 조회

const tokens = await client.fcm.getToken({

  employeeNumber: "25001",

});

  

// 여러 디바이스의 토큰 확인

tokens.tokens.forEach((token) => {

  console.log(`${token.deviceType}: ${token.fcmToken}`);

});

```

  

---

  

## unsubscribe

  

**기능**: 해당 직원의 모든 FCM 토큰 구독을 해지합니다. 로그아웃 시 사용자 모든 디바이스의 토큰을 삭제하는 용도로 사용됩니다.

  

**동작 방식**:

  

1. 필수 파라미터 검증: `employeeId` 또는 `employeeNumber` 중 하나 필수

2. 검증 실패 시 에러를 발생시킵니다.

3. `POST /api/fcm/unsubscribe` 엔드포인트로 요청을 보냅니다.

4. 요청 body에 `employeeId` 또는 `employeeNumber`를 JSON으로 직렬화하여 전송합니다.

5. 서버는 해당 직원의 모든 디바이스의 FCM 토큰을 삭제합니다.

  

**파라미터**:

  

- `params.employeeId` (string, 선택): 직원 ID (UUID)

- `params.employeeNumber` (string, 선택): 사번

  

**반환값**: `Promise<boolean>` - 해지 성공 여부 (true 또는 undefined)

  

**에러 처리**:

  

- 필수 파라미터 누락 시 `Error` 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 로그아웃 시 모든 토큰 해지

await client.fcm.unsubscribe({

  employeeNumber: "25001",

});

  

// employeeId로 해지

await client.fcm.unsubscribe({

  employeeId: "emp-uuid-123",

});

```

  

---

  

## getMultipleTokens

  

**기능**: 여러 직원의 FCM 토큰을 일괄 조회합니다. 알림 서버에서 푸시 알림 발송 시 사용됩니다.

  

**동작 방식**:

  

1. 필수 파라미터 검증:

   - `employeeIds` 또는 `employeeNumbers` 중 하나 필수

   - 둘 다 없거나 배열 길이가 0이면 에러 발생

2. `employeeIds`가 있으면 우선 사용, 없으면 `employeeNumbers` 사용

3. 배열을 쉼표로 구분된 문자열로 변환하여 쿼리 파라미터에 추가합니다.

4. `GET /api/fcm/tokens` 엔드포인트로 요청을 보냅니다.

5. 서버는 여러 직원의 토큰을 직원별로 그룹핑하여 반환합니다.

  

**파라미터**:

  

- `params.employeeIds` (string[], 선택): 직원 ID 배열

- `params.employeeNumbers` (string[], 선택): 사번 배열

  

**반환값**: `Promise<GetMultipleFcmTokensResponse>` - 여러 직원의 FCM 토큰

  

- `byEmployee`: `EmployeeFcmTokens[]` - 직원별로 그룹핑된 토큰 정보

  - `employeeId`: 직원 ID

  - `employeeNumber`: 사번

  - `tokens`: `FcmTokenInfo[]` - 해당 직원의 토큰 배열

- `allTokens`: `FlatFcmTokenInfo[]` - 모든 토큰을 flat하게 나열한 배열

  - 각 토큰에 직원 정보 포함

- `totalEmployees`: 총 직원 수

- `totalTokens`: 총 토큰 수

  

**에러 처리**:

  

- 필수 파라미터 누락 시 `Error` 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 사번 배열로 여러 직원 조회

const tokens = await client.fcm.getMultipleTokens({

  employeeNumbers: ["25001", "25002", "25003"],

});

  

// employeeId 배열로 여러 직원 조회 (우선순위 높음)

const tokens2 = await client.fcm.getMultipleTokens({

  employeeIds: ["uuid-1", "uuid-2", "uuid-3"],

});

  

// 알림 발송에 사용

tokens.allTokens.forEach((token) => {

  // Firebase Admin SDK로 푸시 알림 발송

  sendPushNotification(token.fcmToken, message);

});

```

  

---

  

**문서 버전**: 1.0  

**최종 업데이트**: 2024년  

**SDK 버전**: 0.1.3