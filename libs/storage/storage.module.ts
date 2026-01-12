import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { LocalStorageService } from './local-storage.service';
import type { IStorageService } from './interfaces/storage.interface';

/**
 * Storage Service Provider Token
 * 
 * 이 토큰을 사용하여 환경에 맞는 Storage Service를 주입받을 수 있습니다.
 */
export const STORAGE_SERVICE = 'STORAGE_SERVICE';

/**
 * Storage Module (Factory Pattern)
 * 
 * 환경 변수 STORAGE_TYPE에 따라 적절한 Storage Service를 제공합니다.
 * - 'local': LocalStorageService (개발 환경)
 * - 's3': S3Service (프로덕션 환경)
 */
@Module({
  imports: [ConfigModule],
  providers: [
    S3Service,
    LocalStorageService,
    {
      provide: STORAGE_SERVICE,
      useFactory: (
        configService: ConfigService,
        s3Service: S3Service,
        localStorageService: LocalStorageService,
      ): IStorageService => {
        const storageType = configService.get<string>('STORAGE_TYPE', 'local');
        
        if (storageType === 's3') {
          return s3Service;
        }
        
        return localStorageService;
      },
      inject: [ConfigService, S3Service, LocalStorageService],
    },
  ],
  exports: [STORAGE_SERVICE, S3Service, LocalStorageService],
})
export class StorageModule {}
