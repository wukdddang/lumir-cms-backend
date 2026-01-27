import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

/**
 * 기본 카테고리 확인 스크립트
 * 
 * 사용법:
 * ts-node -r tsconfig-paths/register scripts/migration/check-default-categories.ts
 */

async function bootstrap() {
  console.log('🔍 기본 카테고리 확인 중...\n');

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

    console.log('📊 entityType별 기본 카테고리 (미분류):');
    console.log('='.repeat(70));

    for (const entityType of entityTypes) {
      const result = await dataSource.query(
        `SELECT id, name, "entityType", "isActive", "createdBy" 
         FROM categories 
         WHERE "entityType" = $1 AND name = '미분류'`,
        [entityType],
      );

      if (result.length > 0) {
        console.log(`✅ ${entityType.padEnd(25)} ${result[0].id}`);
      } else {
        console.log(`❌ ${entityType.padEnd(25)} 없음`);
      }
    }

    console.log('='.repeat(70));
    console.log('\n📋 전체 카테고리 통계:');
    console.log('='.repeat(70));

    for (const entityType of entityTypes) {
      const countResult = await dataSource.query(
        `SELECT COUNT(*) as count FROM categories WHERE "entityType" = $1`,
        [entityType],
      );
      const count = countResult[0].count;
      console.log(`  ${entityType.padEnd(25)} ${count.toString().padStart(5)}개`);
    }

    console.log('='.repeat(70));

    // 각 모듈별 데이터와 categoryId 상태 확인
    console.log('\n📦 모듈별 데이터 및 categoryId 상태:');
    console.log('='.repeat(70));

    const modules = [
      { name: 'News', table: 'news' },
      { name: 'IR', table: 'irs' },
      { name: 'ElectronicDisclosure', table: 'electronic_disclosures' },
      { name: 'ShareholdersMeeting', table: 'shareholders_meetings' },
      { name: 'MainPopup', table: 'main_popups' },
      { name: 'LumirStory', table: 'lumir_stories' },
      { name: 'VideoGallery', table: 'video_galleries' },
      { name: 'Announcement', table: 'announcements' },
      { name: 'Brochure', table: 'brochures' },
    ];

    for (const module of modules) {
      const totalResult = await dataSource.query(
        `SELECT COUNT(*) as count FROM ${module.table}`,
      );
      const nullCategoryResult = await dataSource.query(
        `SELECT COUNT(*) as count FROM ${module.table} WHERE "categoryId" IS NULL`,
      );
      
      const total = totalResult[0].count;
      const nullCount = nullCategoryResult[0].count;
      const hasCategory = total - nullCount;

      console.log(
        `  ${module.name.padEnd(25)} 총: ${total.toString().padStart(3)}개  |  카테고리 있음: ${hasCategory.toString().padStart(3)}개  |  NULL: ${nullCount.toString().padStart(3)}개`
      );
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
