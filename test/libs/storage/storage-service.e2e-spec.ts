import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_SERVICE, StorageModule } from '../../../libs/storage/storage.module';
import { IStorageService } from '../../../libs/storage/interfaces/storage.interface';
import { LocalStorageService } from '../../../libs/storage/local-storage.service';
import { S3Service } from '../../../libs/storage/s3.service';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Storage Service 통합 테스트
 * 
 * 환경에 따라 올바른 Storage Service가 주입되는지 검증합니다.
 */
describe('[Integration] Storage Service', () => {
  describe('Factory Pattern - Service Selection', () => {
    it('STORAGE_TYPE=local 일 때 LocalStorageService가 주입되어야 한다', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                STORAGE_TYPE: 'local',
                LOCAL_UPLOAD_DIR: join(process.cwd(), 'uploads'),
                PORT: 4001,
              }),
            ],
          }),
          StorageModule,
        ],
      }).compile();

      const storageService = module.get<IStorageService>(STORAGE_SERVICE);
      expect(storageService).toBeDefined();
      expect(storageService).toBeInstanceOf(LocalStorageService);

      await module.close();
    });

    it('STORAGE_TYPE=s3 일 때 S3Service가 주입되어야 한다', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                STORAGE_TYPE: 's3',
                AWS_REGION: 'ap-northeast-2',
                AWS_S3_BUCKET: 'test-bucket',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
              }),
            ],
          }),
          StorageModule,
        ],
      }).compile();

      const storageService = module.get<IStorageService>(STORAGE_SERVICE);
      expect(storageService).toBeDefined();
      expect(storageService).toBeInstanceOf(S3Service);

      await module.close();
    });

    it('STORAGE_TYPE이 설정되지 않으면 기본값으로 LocalStorageService가 주입되어야 한다', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                // STORAGE_TYPE 미설정
                PORT: 4001,
              }),
            ],
          }),
          StorageModule,
        ],
      }).compile();

      const storageService = module.get<IStorageService>(STORAGE_SERVICE);
      expect(storageService).toBeDefined();
      expect(storageService).toBeInstanceOf(LocalStorageService);

      await module.close();
    });
  });

  describe('LocalStorageService - File Operations', () => {
    let module: TestingModule;
    let storageService: IStorageService;

    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                STORAGE_TYPE: 'local',
                LOCAL_UPLOAD_DIR: join(process.cwd(), 'uploads'),
                PORT: 4001,
              }),
            ],
          }),
          StorageModule,
        ],
      }).compile();

      storageService = module.get<IStorageService>(STORAGE_SERVICE);
    });

    afterAll(async () => {
      await module.close();
    });

    it('파일을 로컬에 업로드할 수 있어야 한다', async () => {
      const testContent = 'Test file content for local storage';
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-upload.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: testContent.length,
        buffer: Buffer.from(testContent),
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await storageService.uploadFile(mockFile, 'test-folder');

      expect(result).toBeDefined();
      expect(result.fileName).toBe('test-upload.txt');
      expect(result.fileSize).toBe(testContent.length);
      expect(result.mimeType).toBe('text/plain');
      expect(result.url).toContain('/uploads/test-folder/');

      // 파일이 실제로 생성되었는지 확인
      const urlParts = result.url.split('/uploads/');
      const filePath = join(process.cwd(), 'uploads', urlParts[1]);
      expect(existsSync(filePath)).toBe(true);

      const fileContent = readFileSync(filePath, 'utf-8');
      expect(fileContent).toBe(testContent);

      // 정리
      await storageService.deleteFile(result.url);
    });

    it('여러 파일을 동시에 업로드할 수 있어야 한다', async () => {
      const files: Express.Multer.File[] = [
        {
          fieldname: 'files',
          originalname: 'file1.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 10,
          buffer: Buffer.from('Content 1'),
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
        {
          fieldname: 'files',
          originalname: 'file2.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 10,
          buffer: Buffer.from('Content 2'),
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
      ];

      const results = await storageService.uploadFiles(files, 'test-folder');

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results[0].order).toBe(0);
      expect(results[1].order).toBe(1);

      // 정리
      await storageService.deleteFiles(results.map(r => r.url));
    });

    it('파일을 삭제할 수 있어야 한다', async () => {
      // 파일 업로드
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'delete-test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 11,
        buffer: Buffer.from('Delete me!'),
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await storageService.uploadFile(mockFile, 'test-folder');
      const urlParts = result.url.split('/uploads/');
      const filePath = join(process.cwd(), 'uploads', urlParts[1]);

      // 파일 존재 확인
      expect(existsSync(filePath)).toBe(true);

      // 파일 삭제
      await storageService.deleteFile(result.url);

      // 파일이 삭제되었는지 확인
      expect(existsSync(filePath)).toBe(false);
    });

    it('존재하지 않는 파일을 삭제해도 에러가 발생하지 않아야 한다', async () => {
      const fakeUrl = 'http://localhost:4001/uploads/test-folder/non-existent.txt';

      // 에러 없이 실행되어야 함
      await expect(
        storageService.deleteFile(fakeUrl)
      ).resolves.not.toThrow();
    });
  });

  describe('Interface Compliance', () => {
    it('LocalStorageService는 IStorageService 인터페이스를 구현해야 한다', () => {
      const service = new LocalStorageService(new ConfigService());
      
      expect(service.uploadFile).toBeDefined();
      expect(service.uploadFiles).toBeDefined();
      expect(service.deleteFile).toBeDefined();
      expect(service.deleteFiles).toBeDefined();
      expect(typeof service.uploadFile).toBe('function');
      expect(typeof service.uploadFiles).toBe('function');
      expect(typeof service.deleteFile).toBe('function');
      expect(typeof service.deleteFiles).toBe('function');
    });

    it('S3Service는 IStorageService 인터페이스를 구현해야 한다', () => {
      const service = new S3Service(new ConfigService());
      
      expect(service.uploadFile).toBeDefined();
      expect(service.uploadFiles).toBeDefined();
      expect(service.deleteFile).toBeDefined();
      expect(service.deleteFiles).toBeDefined();
      expect(typeof service.uploadFile).toBe('function');
      expect(typeof service.uploadFiles).toBe('function');
      expect(typeof service.deleteFile).toBe('function');
      expect(typeof service.deleteFiles).toBe('function');
    });
  });
});
