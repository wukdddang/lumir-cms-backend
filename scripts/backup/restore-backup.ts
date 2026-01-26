import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);

/**
 * 백업 파일 복원 스크립트 (TypeORM 사용, psql 불필요)
 * 
 * 사용법:
 * npm run backup:restore -- <백업파일명>
 * 예: npm run backup:restore -- backup_daily_20260126_165358.sql.gz
 */

async function restoreBackup() {
  let app: any;
  
  try {
    // 커맨드 라인 인자에서 백업 파일명 가져오기
    const backupFileName = process.argv[2];
    
    if (!backupFileName) {
      console.error('❌ 백업 파일명을 지정해주세요.');
      console.log('사용법: npm run backup:restore -- <백업파일명>');
      console.log('예: npm run backup:restore -- backup_daily_20260126_165358.sql.gz');
      process.exit(1);
    }

    // 백업 파일 경로
    const backupsDir = path.join(__dirname, '../../backups/database');
    let backupFilePath: string | null = null;

    // daily, weekly, monthly, four_hourly 폴더에서 백업 파일 찾기
    const backupTypes = ['daily', 'weekly', 'monthly', 'four_hourly'];
    for (const type of backupTypes) {
      const candidatePath = path.join(backupsDir, type, backupFileName);
      try {
        await fs.access(candidatePath);
        backupFilePath = candidatePath;
        break;
      } catch {
        // 파일이 없으면 다음 폴더 확인
      }
    }

    if (!backupFilePath) {
      console.error(`❌ 백업 파일을 찾을 수 없습니다: ${backupFileName}`);
      console.log('\n사용 가능한 백업 목록:');
      console.log('npm run backup:list');
      process.exit(1);
    }

    console.log(`📦 백업 파일: ${backupFilePath}`);

    // .gz 압축 해제
    console.log('\n🔓 압축 해제 중...');
    const compressedData = await fs.readFile(backupFilePath);
    let sqlContent: string;

    if (backupFilePath.endsWith('.gz')) {
      const decompressed = await gunzip(compressedData);
      sqlContent = decompressed.toString('utf8');
      console.log('✅ 압축 해제 완료');
    } else {
      sqlContent = compressedData.toString('utf8');
    }

    const sizeKB = (Buffer.byteLength(sqlContent, 'utf8') / 1024).toFixed(2);
    console.log(`📄 SQL 파일 크기: ${sizeKB} KB`);

    // NestJS 애플리케이션 초기화
    console.log('\n🔄 데이터베이스 연결 중...');
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false, // 로그 최소화
    });

    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('⚠️  경고: 이 작업은 기존 데이터를 덮어씁니다!');
      console.log('🔄 PostgreSQL 복원 중...');

      // SQL 문을 세미콜론으로 분리
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 실행할 SQL 문: ${statements.length}개`);

      // 트랜잭션 없이 각 SQL 문을 개별적으로 실행
      let executedCount = 0;
      let errorCount = 0;
      const totalStatements = statements.length;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // 진행률 표시 (매 100개마다)
        if (i % 100 === 0 && i > 0) {
          const progress = ((i / totalStatements) * 100).toFixed(1);
          console.log(`   진행 중... ${progress}% (${i}/${totalStatements}) - 성공: ${executedCount}, 스킵: ${errorCount}`);
        }

        try {
          await queryRunner.query(statement + ';');
          executedCount++;
        } catch (error: any) {
          // 예상 가능한 오류는 무시 (이미 존재, 없음 등)
          const errorMsg = error.message.toLowerCase();
          if (
            errorMsg.includes('already exists') ||
            errorMsg.includes('does not exist') ||
            errorMsg.includes('duplicate key')
          ) {
            errorCount++;
          } else {
            // 예상치 못한 오류는 경고 표시
            console.warn(`⚠️  SQL 실행 오류 [${i}]: ${error.message.substring(0, 150)}`);
            errorCount++;
          }
        }
      }

      console.log(`\n✅ 복원 완료!`);
      console.log(`   성공: ${executedCount}/${totalStatements}개`);
      console.log(`   스킵: ${errorCount}/${totalStatements}개`);

    } finally {
      await queryRunner.release();
    }

  } catch (error: any) {
    console.error('\n❌ 오류 발생:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

restoreBackup();
