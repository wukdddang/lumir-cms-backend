# OrganizationResource API 가이드

  

조직 정보 조회 및 관리를 위한 API 리소스 클래스입니다. 직원 정보, 부서 계층구조, 관리자 정보 등을 조회할 수 있습니다.

  

## 목차

  

- [getEmployee](#getemployee)

- [getEmployees](#getemployees)

- [getDepartmentHierarchy](#getdepartmenthierarchy)

- [getEmployeesManagers](#getemployeesmanagers)

  

---

  

## getEmployee

  

**기능**: 직원 ID 또는 사번으로 특정 직원의 상세 정보를 조회합니다.

  

**동작 방식**:

  

1. `employeeId` 또는 `employeeNumber` 중 하나가 필수입니다. 둘 다 없으면 에러를 발생시킵니다.

2. 전달된 파라미터를 쿼리 스트링으로 변환합니다.

3. `GET /api/organization/employee` 엔드포인트로 요청을 보냅니다.

4. `withDetail=true`인 경우 부서, 직책, 직급 등의 상세 정보가 포함됩니다.

  

**파라미터**:

  

- `params.employeeId` (string, 선택): 직원 ID

- `params.employeeNumber` (string, 선택): 사번

- `params.withDetail` (boolean, 선택): 상세 정보 포함 여부 (기본값: false)

  

**반환값**: `Promise<Employee>` - 직원 정보 객체

  

- `id`: 직원 ID

- `name`: 이름

- `email`: 이메일

- `employeeNumber`: 사번

- `phoneNumber`: 전화번호

- `dateOfBirth`: 생년월일

- `gender`: 성별

- `hireDate`: 입사일

- `status`: 상태 (재직중, 퇴사 등)

- `department`: 부서 정보 (withDetail=true일 때)

- `position`: 직책 정보 (withDetail=true일 때)

- `rank`: 직급 정보 (withDetail=true일 때)

  

**에러 처리**:

  

- `employeeId`와 `employeeNumber` 모두 없으면 `Error` 발생

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 사번으로 조회

const employee = await client.organization.getEmployee({

  employeeNumber: "00000",

  withDetail: true,

});

  

// employeeId로 조회

const employee2 = await client.organization.getEmployee({

  employeeId: "emp-uuid-123",

});

```

  

---

  

## getEmployees

  

**기능**: 여러 직원의 정보를 조회합니다. `identifiers`가 비어있거나 제공되지 않으면 전체 직원을 조회합니다.

  

**동작 방식**:

  

1. `identifiers` 배열이 있고 길이가 0보다 크면, 쉼표로 구분된 문자열로 변환하여 쿼리 파라미터에 추가합니다.

2. `withDetail`, `includeTerminated` 등의 옵션 파라미터가 있으면 쿼리 파라미터에 추가합니다.

3. `GET /api/organization/employees` 엔드포인트로 요청을 보냅니다.

4. 쿼리 파라미터가 없으면 기본 URL로 요청합니다.

  

**파라미터**:

  

- `params.identifiers` (string[], 선택): 조회할 직원 식별자 배열 (employeeId 또는 employeeNumber 혼합 가능). 비어있으면 전체 직원 조회

- `params.withDetail` (boolean, 선택): 상세 정보 포함 여부

- `params.includeTerminated` (boolean, 선택): 퇴사한 직원 포함 여부

  

**반환값**: `Promise<GetEmployeesResponse>` - 직원 목록과 총 개수

  

- `employees`: `Employee[]` - 직원 정보 배열

- `total`: `number` - 총 직원 수

  

**에러 처리**:

  

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 특정 직원들만 조회

const result = await client.organization.getEmployees({

  identifiers: ["00000", "25001", "25002"],

  withDetail: true,

});

  

// 전체 직원 조회

const allEmployees = await client.organization.getEmployees({

  withDetail: false,

  includeTerminated: false,

});

```

  

---

  

## getDepartmentHierarchy

  

**기능**: 부서의 계층구조를 따라 각 부서에 속한 직원들의 목록을 깊이와 함께 조회합니다.

  

**동작 방식**:

  

1. 옵션 파라미터들을 쿼리 스트링으로 변환합니다.

2. `GET /api/organization/departments/hierarchy` 엔드포인트로 요청을 보냅니다.

3. `rootDepartmentId`가 지정되면 해당 부서부터 시작하여 하위 부서들을 조회합니다.

4. `maxDepth`가 지정되면 최대 깊이까지만 조회합니다.

5. `withEmployeeDetail=true`이면 각 부서에 속한 직원의 상세 정보를 포함합니다.

  

**파라미터**:

  

- `params.rootDepartmentId` (string, 선택): 조회할 최상위 부서 ID (미지정 시 전체 조직 조회)

- `params.maxDepth` (number, 선택): 최대 조회 깊이 (기본값: 무제한)

- `params.withEmployeeDetail` (boolean, 선택): 직원 상세 정보 포함 여부

- `params.includeTerminated` (boolean, 선택): 퇴사한 직원 포함 여부

- `params.includeEmptyDepartments` (boolean, 선택): 빈 부서 포함 여부

  

**반환값**: `Promise<GetDepartmentHierarchyResponse>` - 부서 계층구조 정보

  

- `departments`: `DepartmentHierarchy[]` - 부서 계층구조 배열

  - 각 부서는 `childDepartments` 배열로 하위 부서를 포함 (재귀적 구조)

  - `employees`: 해당 부서에 속한 직원 배열

  - `depth`: 부서 깊이 (0부터 시작)

- `totalDepartments`: 총 부서 수

- `totalEmployees`: 총 직원 수

- `maxDepth`: 실제 조회된 최대 깊이

  

**에러 처리**:

  

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

// 전체 부서 계층구조 조회

const hierarchy = await client.organization.getDepartmentHierarchy({

  withEmployeeDetail: true,

  includeEmptyDepartments: true,

  maxDepth: 5,

});

  

// 특정 부서부터 조회

const subHierarchy = await client.organization.getDepartmentHierarchy({

  rootDepartmentId: "dept-uuid-123",

  maxDepth: 2,

});

```

  

---

  

## getEmployeesManagers

  

**기능**: 전체 직원을 조회하여 각 직원의 소속 부서부터 최상위 부서까지 올라가면서 `isManager=true`인 관리자 정보를 조회합니다.

  

**동작 방식**:

  

1. 별도의 파라미터 없이 `GET /api/organization/employees/managers` 엔드포인트로 요청을 보냅니다.

2. 서버는 전체 직원을 조회하고, 각 직원의 모든 소속 부서에 대해 관리자 라인을 구성합니다.

3. 각 부서별로 소속 부서부터 최상위 부서까지 올라가면서 각 레벨의 관리자들을 찾습니다.

4. 각 직원은 여러 부서에 배치될 수 있으므로, 부서별로 독립적인 관리자 라인 정보를 제공합니다.

  

**파라미터**: 없음

  

**반환값**: `Promise<GetEmployeesManagersResponse>` - 전체 직원의 관리자 라인 정보

  

- `employees`: `EmployeeManagers[]` - 직원별 관리자 정보 배열

  - `employeeId`: 직원 ID

  - `name`: 직원 이름

  - `employeeNumber`: 사번

  - `departments`: `EmployeeDepartmentManagers[]` - 부서별 관리자 정보

    - `departmentId`: 부서 ID

    - `departmentName`: 부서명

    - `managerLine`: `DepartmentManager[]` - 관리자 라인 (소속 부서부터 최상위까지)

      - `departmentId`: 부서 ID

      - `departmentName`: 부서명

      - `departmentCode`: 부서 코드

      - `type`: 부서 유형 (COMPANY/DIVISION/DEPARTMENT/TEAM)

      - `parentDepartmentId`: 상위 부서 ID

      - `depth`: 부서 계층 깊이 (소속 부서가 0)

      - `managers`: `ManagerInfo[]` - 해당 부서의 관리자 목록

        - `employeeId`: 관리자 직원 ID

        - `name`: 관리자 이름

        - `employeeNumber`: 관리자 사번

        - `email`: 관리자 이메일

        - `positionId`: 직책 ID

        - `positionTitle`: 직책명

- `total`: 총 직원 수

  

**에러 처리**:

  

- API 호출 실패 시 HTTP 에러를 그대로 전파

  

**사용 예시**:

  

```typescript

const managers = await client.organization.getEmployeesManagers();

  

// 첫 번째 직원의 첫 번째 부서의 관리자 라인 확인

if (managers.employees.length > 0) {

  const employee = managers.employees[0];

  employee.departments.forEach((dept) => {

    console.log(`${dept.departmentName}의 관리자 라인:`);

    dept.managerLine.forEach((level) => {

      console.log(`  레벨 ${level.depth}: ${level.departmentName}`);

      level.managers.forEach((manager) => {

        console.log(`    - ${manager.name} (${manager.positionTitle})`);

      });

    });

  });

}

```

  

---

  

**문서 버전**: 1.0  

**최종 업데이트**: 2024년  

**SDK 버전**: 0.1.3