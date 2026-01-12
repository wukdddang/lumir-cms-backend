/**
 * 업로드된 파일 정보
 */
export interface UploadedFile {
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  order: number;
}

/**
 * Storage Service 인터페이스
 * 
 * 로컬 파일 시스템 또는 AWS S3 등 다양한 저장소를 추상화합니다.
 */
export interface IStorageService {
  /**
   * 단일 파일을 업로드합니다
   */
  uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadedFile>;

  /**
   * 여러 파일을 업로드합니다
   */
  uploadFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadedFile[]>;

  /**
   * 파일을 삭제합니다
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * 여러 파일을 삭제합니다
   */
  deleteFiles(fileUrls: string[]): Promise<void>;
}
