import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { AppModule } from '../../src/app.module';
import {
  parseMultipleBsonFiles,
  getBsonFileStats,
} from './bson-parser';
import {
  mapCategory,
  mapNews,
  mapPressReleaseToNews,
  mapVideoGallery,
  mapIR,
  mapElectronicDisclosure,
  mapShareholdersMeeting,
  mapNotificationToMainPopup,
  mapPageView,
  createCategoryIdMap,
} from './entity-mapper';
import {
  validateCategory,
  validateNews,
  validatePageView,
  validateVideoGallery,
  validateMainPopup,
  validateUniqueIds,
  printValidationResult,
  mergeValidationResults,
} from './validator';
import { BackupService } from '../../src/context/backup-context/backup.service';
import { BackupType } from '../../src/context/backup-context/backup.types';
import { ValidationResult } from './validator';

/**
 * MongoDB → PostgreSQL 데이터 마이그레이션 스크립트
 *
 * 사용법:
 * npm run migration:from-mongodb
 */

const BSON_DIR = path.join(__dirname, '../../src/migrations/hompage-admin-1');

// 마이그레이션할 컬렉션 목록
const COLLECTIONS = {
  categories: 'categories',
  news: 'news',
  pressreleases: 'pressreleases',
  videos: 'videos',
  irmaterials: 'irmaterials',
  managementdisclosures: 'managementdisclosures',
  shareholdermeetings: 'shareholdermeetings',
  notifications: 'notifications',
  pageviews: 'pageviews',
};

async function bootstrap() {
  console.log('🚀 MongoDB → PostgreSQL 마이그레이션 시작\n');

  // NestJS 애플리케이션 초기화
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // 1. BSON 파일 통계 확인
    console.log('📊 BSON 파일 통계:');
    console.log('='.repeat(60));

    for (const [key, collection] of Object.entries(COLLECTIONS)) {
      const filePath = path.join(BSON_DIR, `${collection}.bson`);
      const stats = getBsonFileStats(filePath);

      if (stats.exists) {
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(
          `  ${collection.padEnd(25)} ${stats.documentCount.toString().padStart(8)} 문서  (${sizeKB} KB)`,
        );
      } else {
        console.log(`  ${collection.padEnd(25)} ${'파일 없음'.padStart(8)}`);
      }
    }
    console.log('='.repeat(60) + '\n');

    // 2. 백업 생성 확인
    const createBackup = await confirm(
      '계속하기 전에 PostgreSQL 백업을 생성하시겠습니까? (권장)',
    );

    if (createBackup) {
      console.log('\n📦 백업 생성 중...');
      const backupService = app.get(BackupService);
      const result = await backupService.createBackup(BackupType.DAILY);

      if (result.success) {
        console.log('✅ 백업 생성 완료:', result.filename);
      } else {
        console.error('❌ 백업 생성 실패:', result.error);
        throw new Error('백업 생성 실패. 마이그레이션을 중단합니다.');
      }
    }

    // 3. BSON 파일 파싱
    console.log('\n📂 BSON 파일 파싱 중...');
    const collections = parseMultipleBsonFiles(
      BSON_DIR,
      Object.values(COLLECTIONS),
    );
    console.log('');

    // 4. 기본 카테고리 조회
    console.log('🔍 기본 카테고리 조회 중...\n');
    const defaultCategoryMap = new Map<string, string>();
    
    const entityTypes = [
      'news',
      'ir',
      'electronic_disclosure',
      'shareholders_meeting',
      'main_popup',
    ];

    for (const entityType of entityTypes) {
      const result = await dataSource.query(
        `SELECT id FROM categories WHERE "entityType" = $1 AND name = '미분류' LIMIT 1`,
        [entityType],
      );
      
      if (result.length > 0) {
        defaultCategoryMap.set(entityType, result[0].id);
        console.log(`  ✅ ${entityType}: ${result[0].id}`);
      } else {
        console.warn(`  ⚠️  ${entityType}: 기본 카테고리 없음`);
      }
    }
    console.log('');

    // 5. 엔티티 매핑
    console.log('🔄 엔티티 매핑 중...\n');

    // 5.1 Categories 매핑 (MongoDB의 공통 카테고리를 루미르스토리/비디오갤러리용으로 복제)
    const targetEntityTypes = ['lumir_story', 'video_gallery'];
    
    const categories: any[] = [];
    for (const mongoCategory of collections.categories) {
      // 루미르스토리와 비디오갤러리용으로만 카테고리 복제
      for (const entityType of targetEntityTypes) {
        const category = mapCategory(mongoCategory);
        // entityType 설정 및 새로운 ID 생성 (원본 ID + entityType으로 결정론적 생성)
        category.entityType = entityType;
        category.id = require('uuid').v5(
          `${category.id}-${entityType}`,
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // UUID_NAMESPACE
        );
        categories.push(category);
      }
    }
    console.log(`✅ Categories: MongoDB ${collections.categories.length}개 → ${categories.length}개 매핑 완료 (루미르스토리/비디오갤러리용)`);

    // 5.2 카테고리 ID 매핑 생성 (루미르스토리/비디오갤러리만)
    const categoryIdMapByEntityType = new Map<string, Map<string, string>>();
    const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    
    for (const entityType of targetEntityTypes) {
      const map = new Map<string, string>();
      for (const mongoCategory of collections.categories) {
        const mongoId = mongoCategory._id;
        const originalUuid = require('uuid').v5(
          typeof mongoId === 'string' ? mongoId : mongoId.toString(),
          UUID_NAMESPACE
        );
        const newUuid = require('uuid').v5(
          `${originalUuid}-${entityType}`,
          UUID_NAMESPACE
        );
        map.set(originalUuid, newUuid);
      }
      categoryIdMapByEntityType.set(entityType, map);
    }
    
    // 다른 모듈들은 빈 Map 사용 (기본 카테고리 사용)
    const emptyCategoryIdMap = new Map<string, string>();

    // 5.3 News 매핑 (news + pressreleases) - 기본 카테고리 사용
    const newsFromNews = collections.news.map((doc) =>
      mapNews(doc, emptyCategoryIdMap, defaultCategoryMap.get('news')),
    );
    const newsFromPressReleases = collections.pressreleases.map((doc) =>
      mapPressReleaseToNews(doc, emptyCategoryIdMap, defaultCategoryMap.get('news')),
    );
    const allNews = [...newsFromNews, ...newsFromPressReleases];
    console.log(
      `✅ News: ${newsFromNews.length}개 + PressReleases: ${newsFromPressReleases.length}개 = 총 ${allNews.length}개 매핑 완료`,
    );

    // 5.4 VideoGallery 매핑
    const videoGalleryCategoryIdMap = categoryIdMapByEntityType.get('video_gallery') || new Map();
    const videoGalleries = collections.videos.map((doc) =>
      mapVideoGallery(doc, videoGalleryCategoryIdMap, defaultCategoryMap.get('video_gallery')),
    );
    console.log(`✅ VideoGalleries: ${videoGalleries.length}개 매핑 완료`);

    // 5.5 IR 매핑 - 기본 카테고리 사용
    const irs = collections.irmaterials.map((doc) => 
      mapIR(doc, emptyCategoryIdMap, defaultCategoryMap.get('ir'))
    );
    console.log(`✅ IRs: ${irs.length}개 매핑 완료`);

    // 5.6 ElectronicDisclosure 매핑 - 기본 카테고리 사용
    const electronicDisclosures = collections.managementdisclosures.map(
      (doc) => mapElectronicDisclosure(doc, emptyCategoryIdMap, defaultCategoryMap.get('electronic_disclosure')),
    );
    console.log(
      `✅ ElectronicDisclosures: ${electronicDisclosures.length}개 매핑 완료`,
    );

    // 5.7 ShareholdersMeeting 매핑 - 기본 카테고리 사용
    const shareholdersMeetings = collections.shareholdermeetings.map((doc) =>
      mapShareholdersMeeting(doc, emptyCategoryIdMap, defaultCategoryMap.get('shareholders_meeting')),
    );
    console.log(
      `✅ ShareholdersMeetings: ${shareholdersMeetings.length}개 매핑 완료`,
    );

    // 4.8 MainPopup 매핑 (notifications) - 기본 카테고리 사용
    const mainPopups = collections.notifications.map((doc) =>
      mapNotificationToMainPopup(doc, emptyCategoryIdMap, defaultCategoryMap.get('main_popup')),
    );
    console.log(`✅ MainPopups: ${mainPopups.length}개 매핑 완료`);

    // 4.9 PageView 매핑
    const pageViews = collections.pageviews.map(mapPageView);
    console.log(`✅ PageViews: ${pageViews.length}개 매핑 완료`);

    // 5. 데이터 검증
    console.log('\n🔍 데이터 검증 중...\n');

    // DB에 이미 존재하는 카테고리 조회
    const existingCategories = await dataSource.query(`SELECT id FROM categories`);
    const existingCategoryIds = existingCategories.map((c) => c.id);
    
    // 마이그레이션할 카테고리와 기존 카테고리를 합쳐서 전체 카테고리 목록 생성
    const allCategories = [
      ...categories,
      ...existingCategoryIds.map((id) => ({ id })),
    ];

    const validationResults: ValidationResult[] = [];

    // 5.1 Categories 검증 (새로 추가할 카테고리만)
    const categoryValidation = mergeValidationResults([
      validateUniqueIds(categories, 'Categories'),
      ...categories.map(validateCategory),
    ]);
    printValidationResult(categoryValidation, 'Categories');
    validationResults.push(categoryValidation);

    // 5.2 News 검증 (전체 카테고리 목록 사용)
    const newsValidation = mergeValidationResults([
      validateUniqueIds(allNews, 'News'),
      ...allNews.map((news) => validateNews(news, allCategories)),
    ]);
    printValidationResult(newsValidation, 'News');
    validationResults.push(newsValidation);

    // 5.3 VideoGallery 검증 (전체 카테고리 목록 사용)
    const videoValidation = mergeValidationResults([
      validateUniqueIds(videoGalleries, 'VideoGalleries'),
      ...videoGalleries.map((vg) => validateVideoGallery(vg, allCategories)),
    ]);
    printValidationResult(videoValidation, 'VideoGalleries');
    validationResults.push(videoValidation);

    // 5.4 MainPopup 검증 (전체 카테고리 목록 사용)
    const popupValidation = mergeValidationResults([
      validateUniqueIds(mainPopups, 'MainPopups'),
      ...mainPopups.map((mp) => validateMainPopup(mp, allCategories)),
    ]);
    printValidationResult(popupValidation, 'MainPopups');
    validationResults.push(popupValidation);

    // 5.5 PageView 검증
    const pageViewValidation = mergeValidationResults([
      validateUniqueIds(pageViews, 'PageViews'),
      ...pageViews.slice(0, 100).map(validatePageView), // 샘플만 검증 (대용량)
    ]);
    printValidationResult(pageViewValidation, 'PageViews (샘플 100개)');
    validationResults.push(pageViewValidation);

    // 검증 실패 시 중단
    const hasValidationErrors = validationResults.some((r) => !r.valid);
    if (hasValidationErrors) {
      throw new Error('데이터 검증 실패. 마이그레이션을 중단합니다.');
    }

    console.log('\n✅ 모든 데이터 검증 통과\n');

    // 6. 데이터 삽입 확인
    const proceed = await confirm(
      `총 ${categories.length + allNews.length + videoGalleries.length + irs.length + electronicDisclosures.length + shareholdersMeetings.length + mainPopups.length + pageViews.length}개의 레코드를 삽입하시겠습니까?`,
    );

    if (!proceed) {
      console.log('마이그레이션이 취소되었습니다.');
      return;
    }

    // 6.5 기존 마이그레이션 데이터 정리
    console.log('\n🧹 기존 마이그레이션 데이터 정리 중...');
    await dataSource.query(`TRUNCATE TABLE page_views CASCADE`);
    await dataSource.query(`TRUNCATE TABLE news CASCADE`);
    await dataSource.query(`TRUNCATE TABLE video_galleries CASCADE`);
    await dataSource.query(`TRUNCATE TABLE irs CASCADE`);
    await dataSource.query(`TRUNCATE TABLE electronic_disclosures CASCADE`);
    await dataSource.query(`TRUNCATE TABLE shareholders_meetings CASCADE`);
    await dataSource.query(`TRUNCATE TABLE main_popups CASCADE`);
    await dataSource.query(`DELETE FROM categories WHERE "createdBy" IS NULL`);
    console.log('✅ 정리 완료\n');

    // 7. 트랜잭션 시작 및 데이터 삽입
    console.log('💾 PostgreSQL에 데이터 삽입 중...\n');

    await dataSource.transaction(async (manager) => {
      // 7.1 Categories 삽입
      if (categories.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('categories')
          .values(categories)
          .execute();
        console.log(`✅ Categories: ${categories.length}개 삽입 완료`);
      }

      // 7.2 News 삽입
      if (allNews.length > 0) {
        await insertInBatches(manager, 'news', allNews, 1000);
        console.log(`✅ News: ${allNews.length}개 삽입 완료`);
      }

      // 7.3 VideoGallery 삽입
      if (videoGalleries.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('video_galleries')
          .values(videoGalleries)
          .execute();
        console.log(`✅ VideoGalleries: ${videoGalleries.length}개 삽입 완료`);
      }

      // 7.4 IR 삽입
      if (irs.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('irs')
          .values(irs)
          .execute();
        console.log(`✅ IRs: ${irs.length}개 삽입 완료`);
      }

      // 7.5 ElectronicDisclosure 삽입
      if (electronicDisclosures.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('electronic_disclosures')
          .values(electronicDisclosures)
          .execute();
        console.log(
          `✅ ElectronicDisclosures: ${electronicDisclosures.length}개 삽입 완료`,
        );
      }

      // 7.6 ShareholdersMeeting 삽입
      if (shareholdersMeetings.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('shareholders_meetings')
          .values(shareholdersMeetings)
          .execute();
        console.log(
          `✅ ShareholdersMeetings: ${shareholdersMeetings.length}개 삽입 완료`,
        );
      }

      // 7.7 MainPopup 삽입
      if (mainPopups.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('main_popups')
          .values(mainPopups)
          .execute();
        console.log(`✅ MainPopups: ${mainPopups.length}개 삽입 완료`);
      }

      // 7.8 PageView 삽입 (대용량 - 배치 처리)
      if (pageViews.length > 0) {
        await insertInBatches(manager, 'page_views', pageViews, 5000);
        console.log(`✅ PageViews: ${pageViews.length}개 삽입 완료`);
      }
    });

    // 8. 삽입 결과 검증
    console.log('\n🔍 삽입 결과 검증 중...\n');

    const counts = {
      categories: await dataSource
        .getRepository('categories')
        .count(),
      news: await dataSource.getRepository('news').count(),
      videoGalleries: await dataSource
        .getRepository('video_galleries')
        .count(),
      irs: await dataSource.getRepository('irs').count(),
      electronicDisclosures: await dataSource
        .getRepository('electronic_disclosures')
        .count(),
      shareholdersMeetings: await dataSource
        .getRepository('shareholders_meetings')
        .count(),
      mainPopups: await dataSource
        .getRepository('main_popups')
        .count(),
      pageViews: await dataSource
        .getRepository('page_views')
        .count(),
    };

    console.log('데이터베이스 레코드 수:');
    console.log(`  Categories: ${counts.categories} (예상: ${categories.length})`);
    console.log(`  News: ${counts.news} (예상: ${allNews.length})`);
    console.log(
      `  VideoGalleries: ${counts.videoGalleries} (예상: ${videoGalleries.length})`,
    );
    console.log(`  IRs: ${counts.irs} (예상: ${irs.length})`);
    console.log(
      `  ElectronicDisclosures: ${counts.electronicDisclosures} (예상: ${electronicDisclosures.length})`,
    );
    console.log(
      `  ShareholdersMeetings: ${counts.shareholdersMeetings} (예상: ${shareholdersMeetings.length})`,
    );
    console.log(
      `  MainPopups: ${counts.mainPopups} (예상: ${mainPopups.length})`,
    );
    console.log(
      `  PageViews: ${counts.pageViews} (예상: ${pageViews.length})`,
    );

    const allMatch =
      counts.categories === categories.length &&
      counts.news === allNews.length &&
      counts.videoGalleries === videoGalleries.length &&
      counts.irs === irs.length &&
      counts.electronicDisclosures === electronicDisclosures.length &&
      counts.shareholdersMeetings === shareholdersMeetings.length &&
      counts.mainPopups === mainPopups.length &&
      counts.pageViews === pageViews.length;

    if (allMatch) {
      console.log('\n✅ 모든 레코드가 정상적으로 삽입되었습니다!');
    } else {
      console.warn('\n⚠️  일부 레코드 수가 일치하지 않습니다. 확인이 필요합니다.');
    }

    console.log('\n✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('\n❌ 마이그레이션 중 오류 발생:');
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

/**
 * 배치 삽입 (대용량 데이터 처리)
 */
async function insertInBatches(
  manager: any,
  table: string,
  data: any[],
  batchSize: number,
): Promise<void> {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await manager
      .createQueryBuilder()
      .insert()
      .into(table)
      .values(batch)
      .execute();

    const progress = Math.min(i + batchSize, data.length);
    console.log(`  진행: ${progress}/${data.length} (${((progress / data.length) * 100).toFixed(1)}%)`);
  }
}

/**
 * 사용자 확인
 */
async function confirm(message: string): Promise<boolean> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question(`${message} (y/N): `, (answer: string) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 스크립트 실행
bootstrap();
