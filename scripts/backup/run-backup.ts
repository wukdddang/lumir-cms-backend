import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { BackupService } from '../../src/context/backup-context/backup.service';
import { BackupType } from '../../src/context/backup-context/backup.types';

/**
 * 백업 실행 스크립트
 *
 * 사용법:
 * npm run backup              # 모든 타입 백업
 * npm run backup four_hourly  # 4시간 백업만
 * npm run backup daily        # 일간 백업만
 * npm run backup weekly       # 주간 백업만
 * npm run backup monthly      # 월간 백업만
 * npm run backup quarterly    # 분기 백업만
 * npm run backup yearly       # 연간 백업만
 */

async function bootstrap() {
  console.log('🚀 백업 스크립트 시작\n');

  // NestJS 애플리케이션 초기화
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const backupService = app.get(BackupService);

    // 명령줄 인자 확인
    const backupTypeArg = process.argv[2];

    if (!backupTypeArg) {
      // 인자가 없으면 모든 타입 백업
      console.log('📦 모든 백업 타입을 실행합니다...\n');
      await runAllBackups(backupService);
    } else {
      // 특정 타입 백업
      const type = backupTypeArg as BackupType;

      if (!Object.values(BackupType).includes(type)) {
        console.error(
          `❌ 올바르지 않은 백업 타입: ${backupTypeArg}\n`,
        );
        console.log('사용 가능한 타입:');
        Object.values(BackupType).forEach((t) => console.log(`  - ${t}`));
        process.exit(1);
      }

      console.log(`📦 ${type} 백업을 실행합니다...\n`);
      await runBackup(backupService, type);
    }

    console.log('\n✅ 백업 스크립트 완료');
  } catch (error) {
    console.error('\n❌ 백업 스크립트 실행 중 오류 발생:');
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

/**
 * 단일 백업 실행
 */
async function runBackup(
  backupService: BackupService,
  type: BackupType,
): Promise<void> {
  const result = await backupService.createBackup(type);

  if (result.success) {
    console.log(`✅ ${type} 백업 성공`);
    console.log(`   파일명: ${result.filename}`);
    console.log(`   경로: ${result.path}`);
    console.log(`   크기: ${formatBytes(result.size)}`);
    if (result.originalSize && result.compressionRatio) {
      console.log(`   원본 크기: ${formatBytes(result.originalSize)}`);
      console.log(`   압축률: ${result.compressionRatio.toFixed(1)}%`);
    }
    console.log(`   시간: ${result.timestamp.toISOString()}`);
  } else {
    console.error(`❌ ${type} 백업 실패`);
    console.error(`   오류: ${result.error}`);
    throw new Error(`백업 실패: ${result.error}`);
  }
}

/**
 * 모든 타입 백업 실행
 */
async function runAllBackups(backupService: BackupService): Promise<void> {
  const results: Array<{
    type: BackupType;
    success: boolean;
    error?: string;
  }> = [];

  for (const type of Object.values(BackupType)) {
    try {
      console.log(`\n📦 ${type} 백업 실행 중...`);
      const result = await backupService.createBackup(type);

      if (result.success) {
        console.log(`✅ ${type} 백업 성공`);
        if (result.originalSize && result.compressionRatio) {
          console.log(`   원본: ${formatBytes(result.originalSize)} → 압축: ${formatBytes(result.size)} (${result.compressionRatio.toFixed(1)}% 절약)`);
        } else {
          console.log(`   크기: ${formatBytes(result.size)}`);
        }
        results.push({ type, success: true });
      } else {
        console.error(`❌ ${type} 백업 실패 - ${result.error}`);
        results.push({ type, success: false, error: result.error });
      }
    } catch (error) {
      console.error(`❌ ${type} 백업 중 예외 발생:`, error.message);
      results.push({ type, success: false, error: error.message });
    }
  }

  // 결과 요약
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log('\n' + '='.repeat(50));
  console.log('📊 백업 결과 요약');
  console.log('='.repeat(50));
  console.log(`✅ 성공: ${successCount}/${results.length}`);
  console.log(`❌ 실패: ${failCount}/${results.length}`);

  if (failCount > 0) {
    console.log('\n실패한 백업:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.type}: ${r.error}`);
      });
    throw new Error(`${failCount}개의 백업이 실패했습니다.`);
  }
}

/**
 * 바이트를 읽기 쉬운 형식으로 변환
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// 스크립트 실행
bootstrap();
