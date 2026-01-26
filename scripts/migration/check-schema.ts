import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DataSource } from 'typeorm';

/**
 * 프로덕션 DB 스키마 상태 확인 스크립트
 */
async function checkSchema() {
  let app: any;
  
  try {
    console.log('🔍 데이터베이스 스키마 확인 중...\n');
    
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    const dataSource = app.get(DataSource);

    // 1. categories 테이블 확인
    console.log('📋 categories 테이블:');
    const categoryColumns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, udt_name
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    if (categoryColumns.length === 0) {
      console.log('  ❌ categories 테이블이 존재하지 않습니다.');
    } else {
      const hasEntityType = categoryColumns.find((c: any) => c.column_name === 'entityType');
      console.log(`  ✅ categories 테이블 존재 (${categoryColumns.length}개 컬럼)`);
      console.log(`  ${hasEntityType ? '✅' : '❌'} entityType 컬럼: ${hasEntityType ? hasEntityType.udt_name : '없음'}`);
      
      if (!hasEntityType) {
        console.log('\n  ⚠️  entityType 컬럼을 추가해야 합니다!');
      }
    }

    // 2. page_views 테이블 확인
    console.log('\n📋 page_views 테이블:');
    const pageViewColumns = await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'page_views'
    `);
    
    if (pageViewColumns.length === 0) {
      console.log('  ❌ page_views 테이블이 존재하지 않습니다.');
      console.log('  ⚠️  page_views 테이블을 생성해야 합니다!');
    } else {
      console.log(`  ✅ page_views 테이블 존재 (${pageViewColumns.length}개 컬럼)`);
    }

    // 3. 각 테이블의 categoryId nullable 확인
    console.log('\n📋 categoryId nullable 확인:');
    const tables = ['news', 'video_galleries', 'irs', 'electronic_disclosures', 'main_popups'];
    
    for (const table of tables) {
      const result = await dataSource.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = 'categoryId'
      `);
      
      if (result.length > 0) {
        const isNullable = result[0].is_nullable === 'YES';
        console.log(`  ${isNullable ? '✅' : '❌'} ${table}: ${isNullable ? 'nullable' : 'NOT NULL'}`);
      } else {
        console.log(`  ⚠️  ${table}: categoryId 컬럼 없음`);
      }
    }

    // 4. 실행된 마이그레이션 목록
    console.log('\n📋 실행된 마이그레이션:');
    const migrations = await dataSource.query(`
      SELECT name, timestamp
      FROM migrations
      ORDER BY id
    `);
    
    migrations.forEach((m: any, idx: number) => {
      console.log(`  ${idx + 1}. ${m.name}`);
    });

    console.log('\n✅ 스키마 확인 완료!');

  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

checkSchema();
