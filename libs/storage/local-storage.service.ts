import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService, UploadedFile } from './interfaces/storage.interface';

/**
 * 로컬 파일 시스템 Storage Service
 * 
 * 개발 환경에서 사용하는 로컬 파일 저장소입니다.
 * 파일은 프로젝트의 'uploads' 폴더에 저장됩니다.
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // 업로드 디렉토리 (프로젝트 루트/uploads)
    this.uploadDir = this.configService.get<string>(
      'LOCAL_UPLOAD_DIR',
      join(process.cwd(), 'uploads'),
    );

    // 로컬 서버 URL
    const port = this.configService.get<number>('PORT', 4001);
    this.baseUrl = this.configService.get<string>(
      'LOCAL_STORAGE_BASE_URL',
      `http://localhost:${port}/uploads`,
    );

    // 업로드 디렉토리 생성
    this.ensureUploadDirExists();

    this.logger.log(`로컬 스토리지 초기화 - 디렉토리: ${this.uploadDir}`);
  }

  /**
   * 업로드 디렉토리가 존재하는지 확인하고 없으면 생성합니다
   */
  private async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`업로드 디렉토리 생성: ${this.uploadDir}`);
    }
  }

  /**
   * 폴더별 디렉토리를 생성합니다
   */
  private async ensureFolderExists(folder: string): Promise<string> {
    const folderPath = join(this.uploadDir, folder);
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
      this.logger.log(`폴더 생성: ${folderPath}`);
    }
    return folderPath;
  }

  /**
   * 파일을 로컬에 업로드합니다
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadedFile> {
    try {
      // 폴더 생성
      const folderPath = await this.ensureFolderExists(folder);

      // 고유한 파일명 생성
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(folderPath, uniqueFileName);

      // 파일 저장
      await fs.writeFile(filePath, file.buffer);

      // URL 생성
      const url = `${this.baseUrl}/${folder}/${uniqueFileName}`;

      this.logger.log(`파일 업로드 성공: ${file.originalname} → ${url}`);

      return {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        url,
        order: 0,
      };
    } catch (error) {
      this.logger.error(`파일 업로드 실패: ${file.originalname}`, error);
      throw new Error(`파일 업로드에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 여러 파일을 로컬에 업로드합니다
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadFile(file, folder).then((uploaded) => ({
        ...uploaded,
        order: index,
      })),
    );

    return await Promise.all(uploadPromises);
  }

  /**
   * 로컬에서 파일을 삭제합니다
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // URL에서 파일 경로 추출
      const url = new URL(fileUrl);
      const relativePath = url.pathname.replace('/uploads/', '');
      const filePath = join(this.uploadDir, relativePath);

      // 파일 삭제
      await fs.unlink(filePath);

      this.logger.log(`파일 삭제 성공: ${fileUrl}`);
    } catch (error) {
      this.logger.error(`파일 삭제 실패: ${fileUrl}`, error);
      // 파일이 없어도 에러를 던지지 않음 (이미 삭제된 경우)
      if (error.code !== 'ENOENT') {
        throw new Error(`파일 삭제에 실패했습니다: ${error.message}`);
      }
    }
  }

  /**
   * 여러 파일을 로컬에서 삭제합니다
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map((url) => this.deleteFile(url));
    await Promise.all(deletePromises);
  }
}
