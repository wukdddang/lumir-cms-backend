# Storage Service 추상화

이 폴더는 파일 저장소를 추상화하여 다양한 환경에서 쉽게 전환할 수 있도록 합니다.

## 아키텍처

### Strategy Pattern 적용
```
IStorageService (Interface)
    ├── LocalStorageService (로컬 파일 시스템)
    └── S3Service (AWS S3)
```

### 환경별 전환
환경 변수 `STORAGE_TYPE`에 따라 자동으로 적절한 서비스가 주입됩니다:
- `local`: 개발 환경 - 로컬 파일 시스템 사용
- `s3`: 프로덕션 환경 - AWS S3 사용

## 사용 방법

### 1. Business Service에서 주입받기

```typescript
import { Inject } from '@nestjs/common';
import { STORAGE_SERVICE } from '@libs/storage/storage.module';
import { IStorageService } from '@libs/storage/interfaces/storage.interface';

@Injectable()
export class YourBusinessService {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  async uploadFiles(files: Express.Multer.File[]) {
    const uploadedFiles = await this.storageService.uploadFiles(
      files,
      'your-folder',
    );
    return uploadedFiles;
  }
}
```

### 2. 환경 설정

#### 로컬 개발 환경 (.env)
```env
STORAGE_TYPE=local
LOCAL_UPLOAD_DIR=uploads
LOCAL_STORAGE_BASE_URL=http://localhost:4001/uploads
```

#### 프로덕션 환경 (.env)
```env
STORAGE_TYPE=s3
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## LocalStorageService

### 특징
- 로컬 파일 시스템에 파일 저장
- `uploads` 폴더에 파일 저장
- NestJS 정적 파일 서빙으로 접근 가능

### 파일 경로 구조
```
project-root/
  └── uploads/
      ├── brochures/
      │   ├── uuid-1.pdf
      │   └── uuid-2.jpg
      └── electronic-disclosures/
          └── uuid-3.pdf
```

### URL 형식
```
http://localhost:4001/uploads/brochures/uuid-1.pdf
```

## S3Service

### 특징
- AWS S3에 파일 업로드
- CloudFront CDN 연동 가능
- 공개 읽기 권한 설정

### 파일 경로 구조
```
s3://your-bucket/
  ├── brochures/
  │   ├── uuid-1.pdf
  │   └── uuid-2.jpg
  └── electronic-disclosures/
      └── uuid-3.pdf
```

### URL 형식
```
https://your-bucket.s3.ap-northeast-2.amazonaws.com/brochures/uuid-1.pdf
```

## 주요 메서드

### uploadFile
단일 파일 업로드
```typescript
const uploaded = await storageService.uploadFile(file, 'folder-name');
// { fileName, fileSize, mimeType, url, order }
```

### uploadFiles
여러 파일 일괄 업로드
```typescript
const uploaded = await storageService.uploadFiles(files, 'folder-name');
// [{ fileName, fileSize, mimeType, url, order }, ...]
```

### deleteFile
단일 파일 삭제
```typescript
await storageService.deleteFile(fileUrl);
```

### deleteFiles
여러 파일 일괄 삭제
```typescript
await storageService.deleteFiles([url1, url2, url3]);
```

## 환경 전환

### 로컬 → 프로덕션
1. `.env` 파일에서 `STORAGE_TYPE=s3`로 변경
2. AWS 자격 증명 설정
3. 애플리케이션 재시작

### 코드 변경 없음!
비즈니스 로직은 `IStorageService` 인터페이스에만 의존하므로,
환경 변수만 변경하면 자동으로 전환됩니다.

## 장점

1. **환경 독립성**: 로컬/프로덕션 환경을 쉽게 전환
2. **테스트 용이**: 로컬에서 AWS 없이 개발 가능
3. **확장성**: 새로운 저장소 추가 시 인터페이스만 구현
4. **유지보수**: 비즈니스 로직과 저장소 로직 분리
