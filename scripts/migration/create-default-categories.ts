import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { v4 as uuidv4 } from 'uuid';

/**
 * 기본 카테고리 생성 스크립트
 * 
 * 사용법:
 * ts-node -r tsconfig-paths/register scripts/migration/create-default-categories.ts
 */

async function bootstrap() {
  console.log('🏗️  기본 카테고리 생성 중...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const entityTypes = [
      'news',
      'ir',
      'electronic_disclosure',
      'shareholders_meeting',
      'main_popup',
      'lumir_story',
      'video_gallery',
      'announcement',
      'brochure',
    ];

    console.log('📊 entityType별 기본 카테고리 (미분류) 생성:');
    console.log('='.repeat(70));

    for (const entityType of entityTypes) {
      // 기존 카테고리 확인
      const existing = await dataSource.query(
        `SELECT id FROM categories WHERE "entityType" = $1 AND name = '미분류'`,
        [entityType],
      );

      if (existing.length > 0) {
        console.log(`⏭️  ${entityType.padEnd(25)} 이미 존재 (${existing[0].id})`);
        continue;
      }

      // 새로운 미분류 카테고리 생성
      const id = uuidv4();
      await dataSource.query(
        `INSERT INTO categories (id, "entityType", name, description, "isActive", "order", "createdAt", "updatedAt", version)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), 1)`,
        [id, entityType, '미분류', '기본 카테고리', true, 0],
      );

      console.log(`✅ ${entityType.padEnd(25)} 생성 완료 (${id})`);
    }

    console.log('='.repeat(70));
    console.log('\n✅ 기본 카테고리 생성 완료!');

  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
